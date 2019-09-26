/*
 * Copyright (C) 2018 Ryan Mason - All Rights Reserved
 *
 * Permissions of this strong copyleft license are conditioned on making available complete source code of licensed works and modifications, which include larger works using a licensed work, under the same license. Copyright and license notices must be preserved. Contributors provide an express grant of patent rights.
 *
 * https://github.com/Rytiggy/Glance/blob/master/LICENSE
 * ------------------------------------------------
 *
 * You are free to modify the code but please leave the copyright in the header.
 *
 * ------------------------------------------------
 */
//import document from "document";
import { inbox } from "file-transfer";
import fs from "fs";
import { vibration } from "haptics";
import DateTime from "../modules/app/dateTime.js";
import BatteryLevels from "../modules/app/batteryLevels.js";
import Graph from "../modules/app/bloodline.js"
import UserActivity from "../modules/app/userActivity.js"
import Alerts from "../modules/app/alerts.js"
import Errors from "../modules/app/errors.js"
import { transfer } from "../modules/app/transfer.js"
import { me } from "appbit";
import { $, hide, show } from '../modules/app/dom';
import { heartRateSensor, bodyPresenceSensor } from '../modules/app/sensors';
import { appSettings } from '../modules/app/app-settings';
import Clock from '../modules/app/clock';

const dateTime = new DateTime();
const batteryLevels = new BatteryLevels();
const graph = new Graph();
const userActivity = new UserActivity();
const alerts = new Alerts();
const errors = new Errors();

let main = $("main");
let sgv = $("sgv");
let rawbg = $("rawbg");
let tempBasal = $("tempBasal");
let largeGraphsSgv = $("largeGraphsSgv");
let delta = $('delta');
let largeGraphDelta = $('largeGraphDelta');
let timeOfLastSgv = $("timeOfLastSgv");
let largeGraphTimeOfLastSgv = $("largeGraphTimeOfLastSgv");
let largeGraphIob = $("largeGraphIob");
let largeGraphCob = $("largeGraphCob");
let iob = $("iob");
let cob = $("cob");

let dateElement = $("date");
let timeElement = $("time");
let largeGraphTime = $("largeGraphTime");
let weather = $("weather");
let arrows = $("arrows");
let largeGraphArrows = $("largeGraphArrows");
let alertArrows = $("alertArrows");
let batteryLevel = $("battery-level");
let steps = $("steps");
let stepIcon = $("stepIcon");
let heart = $("heart");
let heartIcon = $("heartIcon");
let bgColor = $("bgColor");
let largeGraphBgColor = $("largeGraphBgColor");
let batteryPercent = $("batteryPercent");
let popup = $("popup");
let dismiss = popup.getElementById("dismiss");
let errorText = $("error");
let popupTitle = $("popup-title");
let degreeIcon = $("degreeIcon");
let goToLargeGraph = $("goToLargeGraph");

let largeGraphLoopStatus = $("largeGraphLoopStatus");
let largeGraphView = $("largeGraphView");
let exitLargeGraph = $("exitLargeGraph");

let largeGraphSyringe = $("largeGraphSyringe");
let largeGraphHamburger = $("largeGraphHamburger");
let syringe = $("syringe");
let hamburger = $("hamburger");
let predictedBg = $("predictedBg");
const statusLine = $('status-line');
const largeGraphStatusLine = $('largeGraphStatusLine');
const socketMainStatusLine = $('socketMainStatusLine');

let settings = appSettings.readFromFilesystemOrDefaults();

let dismissHighFor = settings.dismissHighFor;
let dismissLowFor = settings.dismissLowFor;

let data = null;
let DISABLE_ALERTS = false;
let isRequestingBGReading = false;

// Data to send back to phone
let dataToSend = {
    heart: 0,
    steps: userActivity.get().steps,
    lastBgTime: null
};

dismiss.onclick = function (evt) {
    console.log("DISMISS");
    hide(popup);
    hide(popupTitle);
    vibration.stop();
    DISABLE_ALERTS = true;
    let currentBgFromBloodSugars = getFistBgNonpredictiveBG(data.bloodSugars.bgs);

    if (currentBgFromBloodSugars.sgv >= parseInt(settings.highThreshold)) {
        console.log("HIGH " + dismissHighFor);
        setTimeout(disableAlertsFalse, (dismissHighFor * 1000) * 60);
    }
    else {
        // 15 mins 
        console.log("LOW " + dismissLowFor);
        setTimeout(disableAlertsFalse, (dismissLowFor * 1000) * 60);
    }
}

function disableAlertsFalse() {
    DISABLE_ALERTS = false;
}

sgv.text = '---';
rawbg.text = ''
delta.text = '';
largeGraphDelta.text = '';
iob.text = '0.0';
cob.text = '0.0';
largeGraphIob.text = '0.0';
largeGraphCob.text = '0.0';
dateElement.text = '';
timeOfLastSgv.text = '';
//weather.text = '--';
steps.text = '--';
heart.text = '--';
batteryPercent.text = '%';
bgColor.gradient.colors.c1 = settings.bgColor;
largeGraphBgColor.gradient.colors.c1 = settings.bgColor;
errorText.text = '';
weather.text = '';
hide(degreeIcon);
hide(statusLine);
show(largeGraphStatusLine)

new Clock(function (evt) {
    const timeText = dateTime.getTime(settings.timeFormat, evt.date);

    timeElement.text = timeText;
    largeGraphTime.text = timeText;
    dateElement.text = dateTime.getDate(settings.dateFormat, settings.enableDOW);
})

function updateSocketStatusLine(code = '') {
    socketMainStatusLine.text = `${transfer.socketState()}${code !== '' ? ' ' + code : ''}`;
    largeGraphStatusLine.text = `socket: ${transfer.socketState()}${code !== '' ? ' ' + code : ''}`;
}

transfer.onOpen(function (evt) {
    updateSocketStatusLine()
}).onClose(function (evt) {
    updateSocketStatusLine()
}).onError(function (evt) {
    updateSocketStatusLine('[err]')
}).onMessageSent(function () {
    updateSocketStatusLine('[>>]')
}).onMessageReceived(function (evt) {
    if (evt.data.cmd === 'BG_READING_MATCH') {
        updateSocketStatusLine('[=]');
    }
});

bodyPresenceSensor.start();

heartRateSensor.onReading(function (data) {
    //console.log(`bodyPresenceSensor.sensor.present = ${bodyPresenceSensor.sensor.present}`)
    heart.text = bodyPresenceSensor.sensor.present ? data.heartRate : '--';
}).start();

update()
const updateIntervalId = setInterval(update, 20000);

inbox.onnewfile = () => {
    console.log(`App -> New file!`);
    isRequestingBGReading = false;
    let fileName;

    while (fileName = inbox.nextFile()) {
        data = fs.readFileSync(fileName, "cbor");
        if (data.settings) {
            //Object.keys(data.settings).forEach(key => console.log(`${key}: ${data.settings[key]}`))
            appSettings.writeToFilesystem(data.settings);
        }

        updateSocketStatusLine('[<<]')
        update();
        //display.poke();
    }
};

function update() {
    // Data to send back to phone
    dataToSend = {
        heart: heartRateSensor.sensor.heartRate || 0,
        steps: userActivity.get().steps
    };

    if (data) {
        settings = data.settings;
        // bloodsugars
        let currentBgFromBloodSugars = getFistBgNonpredictiveBG(data.bloodSugars.bgs);

        updateLayout(settings, currentBgFromBloodSugars)

        console.warn(`GOT DATA epoch ${currentBgFromBloodSugars.datetime}, svg ${currentBgFromBloodSugars.currentbg}`);
        dataToSend.lastBgTime = currentBgFromBloodSugars.datetime;

        sgv.text = currentBgFromBloodSugars.currentbg;
        largeGraphsSgv.text = currentBgFromBloodSugars.currentbg;

        rawbg.text = currentBgFromBloodSugars.rawbg ? currentBgFromBloodSugars.rawbg + ' ' : '';
        tempBasal.text = currentBgFromBloodSugars.tempbasal || '';
        predictedBg.text = currentBgFromBloodSugars.predictedbg || '';

        const timeSenseLastSGVData = dateTime.getTimeSenseLastSGV(currentBgFromBloodSugars.datetime);
        timeOfLastSgv.text = timeSenseLastSGVData[0];
        largeGraphTimeOfLastSgv.text = timeSenseLastSGVData[0];

        let timeSenseLastSGV = timeSenseLastSGVData[1];
        const lastBgReadingMinAgo = parseInt(timeSenseLastSGV, 10);
        // if DISABLE_ALERTS is true check if user is in range 
        if (DISABLE_ALERTS && settings.resetAlertDismissal) {
            if (lastBgReadingMinAgo < settings.staleDataAlertAfter && currentBgFromBloodSugars.direction != 'DoubleDown' && currentBgFromBloodSugars.direction != 'DoubleUp' && currentBgFromBloodSugars.loopstatus != 'Warning') { // Dont reset alerts for LOS, DoubleUp, doubleDown, Warning
                if (currentBgFromBloodSugars.sgv > parseInt(settings.lowThreshold) && currentBgFromBloodSugars.sgv < parseInt(settings.highThreshold)) { // if the BG is between the threshold 
                    console.error('here', DISABLE_ALERTS, lastBgReadingMinAgo)
                    disableAlertsFalse()
                }
            }
        }

        if (!isRequestingBGReading && lastBgReadingMinAgo >= 5) {
            console.log(`Last reading is from over ${lastBgReadingMinAgo} minutes ago. Requesting data...`)
            transfer.send(copy(dataToSend, { reason: `bg reading over ${lastBgReadingMinAgo} min ago` }));
            isRequestingBGReading = true;
        }

        alerts.check(currentBgFromBloodSugars, settings, DISABLE_ALERTS, timeSenseLastSGV);
        errors.check(timeSenseLastSGV, currentBgFromBloodSugars.currentbg);

        let deltaText = currentBgFromBloodSugars.bgdelta
        // add Plus
        if (deltaText > 0) {
            deltaText = '+' + deltaText;
        }
        delta.text = deltaText + ' ' + settings.glucoseUnits;
        largeGraphDelta.text = deltaText + ' ' + settings.glucoseUnits;
        largeGraphLoopStatus.text = currentBgFromBloodSugars.loopstatus;

        arrows.href = '../resources/img/arrows/' + currentBgFromBloodSugars.direction + '.png'
        largeGraphArrows.href = '../resources/img/arrows/' + currentBgFromBloodSugars.direction + '.png';

        graph.update(data.bloodSugars.bgs, settings.highThreshold, settings.lowThreshold, settings);
    }
    else {
        console.warn('NO DATA');

        if (transfer.socketState() === 'OPEN') {
            setTimeout(function () {
                isRequestingBGReading = true;
                transfer.send(copy(dataToSend, { reason: `Initial transfer request from App` }));
            }, 2000);
        }
        else {
            updateSocketStatusLine()
        }

        updateLayout(settings);
    }

    isRequestingBGReading ? show(statusLine).text = 'sync' : hide(statusLine);

    batteryLevel.width = batteryLevels.get().level;
    batteryLevel.style.fill = batteryLevels.get().color;
    batteryPercent.text = '' + batteryLevels.get().percent + '%';
}

function updateLayout(settings, currentBgFromBloodSugars = {}) {
    //console.log('updateLayout currentBgFromBloodSugars = '  + JSON.stringify(currentBgFromBloodSugars));
    //console.log('updateLayout settings = '  + JSON.stringify(settings));

    dismissHighFor = settings.dismissHighFor;
    dismissLowFor = settings.dismissLowFor;

    // colors
    bgColor.gradient.colors.c1 = settings.bgColor;
    bgColor.gradient.colors.c2 = settings.bgColorTwo;

    largeGraphBgColor.gradient.colors.c1 = settings.bgColor;
    largeGraphBgColor.gradient.colors.c2 = settings.bgColorTwo;

    setTextColor(settings.textColor)

    goToLargeGraph.style.display = settings.largeGraph ? 'inline' : 'none';

    // Layout options
    updateIob(settings, currentBgFromBloodSugars);
    updateCob(settings, currentBgFromBloodSugars);
    updateSteps(settings, currentBgFromBloodSugars);
    updateHeart(settings, currentBgFromBloodSugars);
}

function updateIob(settings, currentBgFromBloodSugars) {
    if (currentBgFromBloodSugars[settings.layoutOne] && settings.layoutOne != 'iob') {
        iob.text = currentBgFromBloodSugars[settings.layoutOne];
        hide(syringe);
        iob.x = 10;
    } else {
        iob.text = commas(userActivity.get().steps);
        show(syringe);
        iob.x = 35;
        if (currentBgFromBloodSugars.iob && currentBgFromBloodSugars.iob != 0) {
            iob.text = currentBgFromBloodSugars.iob + '';
            largeGraphIob.text = currentBgFromBloodSugars.iob + '';
            show(syringe);
            show(largeGraphSyringe);
        } else {
            iob.text = '';
            largeGraphIob.text = '';
            hide(syringe);
            hide(largeGraphSyringe);
        }
    }
}

function updateCob(settings, currentBgFromBloodSugars) {
    if (currentBgFromBloodSugars[settings.layoutTwo] && settings.layoutTwo != 'cob') {
        cob.text = currentBgFromBloodSugars[settings.layoutTwo];
        hamburger.style.display = 'none';
        cob.x = 10;
    } else {
        cob.text = userActivity.get().heartRate;
        hamburger.style.display = 'inline';
        cob.x = 35;
        if (currentBgFromBloodSugars.cob && currentBgFromBloodSugars.cob != 0) {
            cob.text = currentBgFromBloodSugars.cob + '';
            largeGraphCob.text = currentBgFromBloodSugars.cob + '';
            hamburger.style.display = "inline";
            largeGraphHamburger.style.display = "inline";
        } else {
            cob.text = '';
            largeGraphCob.text = '';
            hamburger.style.display = "none";
            largeGraphHamburger.style.display = "none";
        }
    }

}

function updateSteps(settings, currentBgFromBloodSugars) {
    if (currentBgFromBloodSugars[settings.layoutThree] && settings.layoutThree != 'steps') {
        steps.text = currentBgFromBloodSugars[settings.layoutThree];
        stepIcon.style.display = 'none';
        steps.x = 10;
    } else {
        steps.text = commas(userActivity.get().steps);
        stepIcon.style.display = 'inline';
        steps.x = 35;
    }
}

function updateHeart(settings, currentBgFromBloodSugars) {
    if (currentBgFromBloodSugars[settings.layoutFour] && settings.layoutFour != 'heart') {
        //heart.text = currentBgFromBloodSugars[settings.layoutFour];
        hide(heartIcon)
        heart.x = 10;
    }
    else {
        //heart.text = userActivity.get().heartRate || 'off';
        show(heartIcon)
        heart.x = 35;
    }
}

function commas(value) {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
* Get Fist BG that is not a predictive BG
* @param {Array} bgs
* @returns {Array}
*/
function getFistBgNonpredictiveBG(bgs) {
    return bgs.filter((bg) => {
        if (bg.bgdelta || bg.bgdelta === 0) {
            return true;
        }
    })[0];
}


function setTextColor(color) {
    let domElemets = ['iob', 'cob', 'heart', 'steps', 'batteryPercent', 'date', 'delta', 'timeOfLastSgv', 'time', 'high', 'low', 'largeGraphHigh', 'largeGraphLow', 'largeGraphDelta', 'largeGraphTimeOfLastSgv', 'largeGraphIob', 'largeGraphCob', 'predictedBg', 'largeGraphTime', 'largeGraphLoopStatus', 'tempBasal'];
    domElemets.forEach(ele => {
        $(ele).style.fill = color
    })
}


goToLargeGraph.onclick = (e) => {
    vibration.start('bump');
    show(largeGraphView);
    hide(main);
}

exitLargeGraph.onclick = (e) => {
    vibration.start('bump');
    hide(largeGraphView);
    show(main);
}

timeElement.onclick = (e) => {
    console.log("FORCE Activated!");
    transfer.send(copy(dataToSend, { reason: 'force refresh' }));
    vibration.start('bump');

    const loadingIcon = '../resources/img/arrows/loading.png'
    arrows.href = loadingIcon;
    largeGraphArrows.href = loadingIcon;
    alertArrows.href = loadingIcon;
}

me.onunload = () => {
    console.log('App -> onunload event')
    clearInterval(updateIntervalId)
}

function copy(mainObj, extraObj) {
    let objCopy = {};
    let key;

    for (key in mainObj) {
        objCopy[key] = mainObj[key];
    }
    for (key in extraObj) {
        objCopy[key] = extraObj[key]
    }
    return objCopy;
}

//<div>Icons made by <a href="http://www.freepik.com" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a></div><div>Icons made by <a href="https://www.flaticon.com/authors/designerz-base" title="Designerz Base">Designerz Base</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a></div><div>Icons made by <a href="https://www.flaticon.com/authors/twitter" title="Twitter">Twitter</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a></div>

