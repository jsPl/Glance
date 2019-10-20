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
// import { inbox } from "file-transfer";
// import fs from "fs";
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
import { shallowObjectCopy } from '../common';
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
const xdripSnoozeBtn = $('xdripSnoozeBtn');

let settings = appSettings.readFromFilesystemOrDefaults();

let data = null;
let ALERTS_SNOOZED = false;
let isRequestingBGReading = false;
let pingCompanionIntervalId;

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
    ALERTS_SNOOZED = true;
    let currentBgReading = getFistBgNonpredictiveBG(data.bloodSugars.bgs);

    if (currentBgReading.sgv >= parseInt(settings.highThreshold)) {
        console.log("HIGH " + settings.dismissHighFor);
        setTimeout(disableAlertsFalse, (settings.dismissHighFor * 1000) * 60);
    }
    else {
        console.log("LOW " + settings.dismissLowFor);
        setTimeout(disableAlertsFalse, (settings.dismissLowFor * 1000) * 60);
    }
}

xdripSnoozeBtn.onclick = evt => {
    console.log('App -> Snoozing xDrip alert')
    transfer.sendMessage({ cmd: 'XDRIP_ALERT_SNOOZE' })
}

function disableAlertsFalse() {
    ALERTS_SNOOZED = false;
}

sgv.text = '---';
rawbg.text = ''
delta.text = '';
largeGraphDelta.text = '';
iob.text = '--';
cob.text = '--';
largeGraphIob.text = '--';
largeGraphCob.text = '--';
dateElement.text = '';
timeOfLastSgv.text = '';
steps.text = '--';
heart.text = '--';
batteryPercent.text = '%';
bgColor.gradient.colors.c1 = settings.bgColor;
largeGraphBgColor.gradient.colors.c1 = settings.bgColor;
errorText.text = '';
weather.text = '';

hide(degreeIcon);
hide(statusLine);
hide(largeGraphStatusLine)

new Clock(function ({ date }) {
    const [timeHHMM, timeHHMMSS] = dateTime.getTime(settings.timeFormat, date);

    timeElement.text = timeHHMM;
    largeGraphTime.text = timeHHMMSS;
    dateElement.text = dateTime.getDate(settings.dateFormat, settings.enableDOW);
}, 'seconds')

function updateSocketStatusLine(code = '') {
    socketMainStatusLine.text = `${transfer.socketState()}${code !== '' ? ' ' + code : ''}`;
    //largeGraphStatusLine.text = `socket: ${transfer.socketState()}${code !== '' ? ' ' + code : ''}`;
}

transfer
    .onOpen(function (evt) {
        isRequestingBGReading = false;
        updateSocketStatusLine()
    })
    .onClose(function (evt) {
        isRequestingBGReading = false;
        updateSocketStatusLine()
    })
    .onError(function (evt) {
        updateSocketStatusLine('[err]')
    })
    .onMessageSent(function () {
        updateSocketStatusLine('[>>]')
    })
    .onMessageReceived(function ({ data }) {
        const { cmd } = data;
        if (cmd === 'BG_READING_MATCH') {
            updateSocketStatusLine('[=]');
        }
        else if (cmd === 'XDRIP_ALERT_SNOOZE_SUCCESS') {
            updateSocketStatusLine('[<<]');
        }
    })
    .onFileDataReceived(function ({ cmd, payload }) {
        console.log(`App -> New file! cmd: ${cmd}`);
        data = payload;
        isRequestingBGReading = false;

        // Clear pinging companion when got first data
        if (pingCompanionIntervalId) {
            console.log('App -> Incoming data: clearInterval for data request')
            pingCompanionIntervalId = clearInterval(pingCompanionIntervalId);
        }

        if (data.settings) {
            // Settings changed
            //Object.keys(data.settings).forEach(key => console.log(`${key}: ${data.settings[key]}`))
            appSettings.writeToFilesystem(data.settings);
            settings = data.settings;
        }

        updateSocketStatusLine('[<<]')
        update();
        //display.poke();
    });

bodyPresenceSensor
    .onReading(function ({ present }) {
        if (present) {
            heartRateSensor.start()
        }
        else {
            heartRateSensor.stop();
            heart.text = '--';
        }
    }).start();

heartRateSensor
    .onReading(function ({ heartRate }) {
        heart.text = heartRate ? heartRate : '--';
    })
    .start();

update()
const updateIntervalId = setInterval(update, 20000);

function update() {
    // Data to send back to phone
    dataToSend = {
        heart: heartRateSensor.sensor.heartRate || 0,
        steps: userActivity.get().steps
    };

    if (data) {
        // bloodsugars
        let currentBgReading = getFistBgNonpredictiveBG(data.bloodSugars.bgs);

        updateLayout(currentBgReading)

        console.warn(`GOT DATA epoch ${currentBgReading.datetime}, sgv ${currentBgReading.currentbg}`);
        dataToSend.lastBgTime = currentBgReading.datetime;

        sgv.text = currentBgReading.currentbg;
        largeGraphsSgv.text = currentBgReading.currentbg;

        rawbg.text = currentBgReading.rawbg ? currentBgReading.rawbg + ' ' : '';
        tempBasal.text = currentBgReading.tempbasal || '';
        predictedBg.text = currentBgReading.predictedbg || '';

        const timeSenseLastSGVData = dateTime.getTimeSenseLastSGV(currentBgReading.datetime);
        timeOfLastSgv.text = timeSenseLastSGVData[0];
        largeGraphTimeOfLastSgv.text = timeSenseLastSGVData[0];

        let timeSenseLastSGV = timeSenseLastSGVData[1];
        const lastBgReadingMinAgo = parseInt(timeSenseLastSGV, 10);

        // if ALERTS_SNOOZED check if user is in range 
        if (ALERTS_SNOOZED && settings.resetAlertDismissal) {
            if (lastBgReadingMinAgo < settings.staleDataAlertAfter && currentBgReading.direction != 'DoubleDown' && currentBgReading.direction != 'DoubleUp' && currentBgReading.loopstatus != 'Warning') { // Dont reset alerts for LOS, DoubleUp, doubleDown, Warning
                if (currentBgReading.sgv > parseInt(settings.lowThreshold) && currentBgReading.sgv < parseInt(settings.highThreshold)) { // if the BG is between the threshold 
                    console.error('here ' + ALERTS_SNOOZED + ' ' + lastBgReadingMinAgo)
                    disableAlertsFalse()
                }
            }
        }

        if (!isRequestingBGReading && lastBgReadingMinAgo >= 5) {
            console.log(`Last reading is from over ${lastBgReadingMinAgo} minutes ago. Requesting data...`)
            const success = transfer.sendMessage({
                cmd: 'FORCE_COMPANION_TRANSFER',
                payload: shallowObjectCopy(dataToSend, { reason: `bg reading over ${lastBgReadingMinAgo} min ago` })
            });
            isRequestingBGReading = success;
        }

        alerts.check(currentBgReading, settings, ALERTS_SNOOZED, timeSenseLastSGV);
        errors.check(timeSenseLastSGV, currentBgReading.currentbg);

        let deltaText = currentBgReading.bgdelta
        // add Plus
        if (deltaText > 0) {
            deltaText = '+' + deltaText;
        }
        delta.text = deltaText + ' ' + settings.glucoseUnits;
        largeGraphDelta.text = deltaText + ' ' + settings.glucoseUnits;
        largeGraphLoopStatus.text = currentBgReading.loopstatus;

        arrows.href = '../resources/img/arrows/' + currentBgReading.direction + '.png'
        largeGraphArrows.href = '../resources/img/arrows/' + currentBgReading.direction + '.png';

        graph.update(data.bloodSugars.bgs, settings.highThreshold, settings.lowThreshold, settings);
    }
    else {
        console.warn('NO DATA');

        if (!pingCompanionIntervalId) {
            console.log('App -> No data: setInterval for data request')

            pingCompanionIntervalId = setInterval(function () {
                if (transfer.socketState() === 'OPEN') {
                    // Socket is open but no file received from companion yet.
                    transfer.sendMessage({
                        cmd: 'FORCE_COMPANION_TRANSFER',
                        payload: shallowObjectCopy(dataToSend, { reason: 'Socket open but no SGV data transfered' })
                    })
                }
                else {
                    // Try to wake up companion with file transfer
                    transfer.sendFile({ cmd: 'PING', payload: Date.now() })
                    updateSocketStatusLine('[FT]')
                }
            }, 15000)
        }

        updateLayout();
    }

    isRequestingBGReading ? show(statusLine).text = 'sync' : hide(statusLine);
}

function updateLayout(currentBgReading = {}) {
    // colors
    bgColor.gradient.colors.c1 = settings.bgColor;
    bgColor.gradient.colors.c2 = settings.bgColorTwo;

    largeGraphBgColor.gradient.colors.c1 = settings.bgColor;
    largeGraphBgColor.gradient.colors.c2 = settings.bgColorTwo;

    setTextColor(settings.textColor)

    goToLargeGraph.style.display = settings.largeGraph ? 'inline' : 'none';

    // Layout options
    updateIob(currentBgReading);
    updateCob(currentBgReading);
    updateSteps(currentBgReading);
    updateHeart(currentBgReading);

    batteryLevel.width = batteryLevels.get().level;
    batteryLevel.style.fill = batteryLevels.get().color;
    batteryPercent.text = '' + batteryLevels.get().percent + '%';
}

function updateIob(currentBgReading) {
    if (currentBgReading[settings.layoutOne] && settings.layoutOne != 'iob') {
        iob.text = currentBgReading[settings.layoutOne];
        hide(syringe);
        iob.x = 10;
    } else {
        iob.text = commas(userActivity.get().steps);
        show(syringe);
        iob.x = 35;
        if (currentBgReading.iob && currentBgReading.iob != 0) {
            iob.text = currentBgReading.iob + '';
            largeGraphIob.text = currentBgReading.iob + '';
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

function updateCob(currentBgReading) {
    if (currentBgReading[settings.layoutTwo] && settings.layoutTwo != 'cob') {
        cob.text = currentBgReading[settings.layoutTwo];
        hamburger.style.display = 'none';
        cob.x = 10;
    } else {
        cob.text = userActivity.get().heartRate;
        hamburger.style.display = 'inline';
        cob.x = 35;
        if (currentBgReading.cob && currentBgReading.cob != 0) {
            cob.text = currentBgReading.cob + '';
            largeGraphCob.text = currentBgReading.cob + '';
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

function updateSteps(currentBgReading) {
    if (currentBgReading[settings.layoutThree] && settings.layoutThree != 'steps') {
        steps.text = currentBgReading[settings.layoutThree];
        stepIcon.style.display = 'none';
        steps.x = 10;
    } else {
        steps.text = commas(userActivity.get().steps);
        stepIcon.style.display = 'inline';
        steps.x = 35;
    }
}

function updateHeart(currentBgReading) {
    if (currentBgReading[settings.layoutFour] && settings.layoutFour != 'heart') {
        //heart.text = currentBgFromBloodSugars[settings.layoutFour];
        hide(heartIcon)
        heart.x = 10;
    }
    else {
        show(heartIcon)
        heart.x = 35;
    }
}

function commas(value) {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
* Get Fist BG that is not a predictive BG
*/
function getFistBgNonpredictiveBG(bgs = []) {
    return bgs.filter(bg => bg.bgdelta || bg.bgdelta === 0)[0]
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
    transfer.sendMessage({
        cmd: 'FORCE_COMPANION_TRANSFER',
        payload: shallowObjectCopy(dataToSend, { reason: 'force refresh' })
    });
    vibration.start('bump');

    //transfer.sendFile({ cmd: 'PING', payload: Date.now() })

    const loadingIcon = '../resources/img/arrows/loading.png'
    arrows.href = loadingIcon;
    largeGraphArrows.href = loadingIcon;
    alertArrows.href = loadingIcon;
}

me.onunload = () => {
    console.log('App -> onunload event')
    clearInterval(updateIntervalId);
    clearInterval(pingCompanionIntervalId);
}

setTimeout(transfer.processIncomingFiles, 1000);

//<div>Icons made by <a href="http://www.freepik.com" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a></div><div>Icons made by <a href="https://www.flaticon.com/authors/designerz-base" title="Designerz Base">Designerz Base</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a></div><div>Icons made by <a href="https://www.flaticon.com/authors/twitter" title="Twitter">Twitter</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a></div>

