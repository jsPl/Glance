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
import { settingsStorage } from "settings";

import Settings from "../modules/companion/settings.js";
import Transfer from "../modules/companion/transfer.js";
import Fetch from "../modules/companion/fetch.js";
import Standardize from "../modules/companion/standardize.js";
// import Weather from "../modules/companion/weather.js";
import Logs from "../modules/companion/logs.js";
import Sizeof from "../modules/companion/sizeof.js";
import Dexcom from "../modules/companion/dexcom.js";

import * as messaging from "messaging";
import { me } from "companion";
import { app, device } from "peer";

const settings = new Settings();
const transfer = new Transfer();
const fetch = new Fetch();
const standardize = new Standardize();
const dexcom = new Dexcom();

// const weatherURL = new Weather();
const logs = new Logs();
//const sizeof = new Sizeof();
let dataReceivedFromWatch = null;

async function sendData() {
    //logs.add('companion - sendData: Version: 2.1.100')
    // Get settings 
    const store = settings.get(dataReceivedFromWatch);

    // Get SGV data
    let bloodsugars = null;
    let extraData = null;
    if (store.url === 'dexcom') {
        let USAVSInternational = store.USAVSInternational;
        let subDomain = 'share2';
        if (USAVSInternational) {
            subDomain = 'shareous1';
        }
        let sessionId = await dexcom.getSessionId(store.dexcomUsername, store.dexcomPassword, subDomain);
        if (store.dexcomUsername && store.dexcomPassword) {
            bloodsugars = await dexcom.getData(sessionId, subDomain);
        }
        else {
            bloodsugars = {
                error: {
                    status: "500"
                }
            }
        }
    }
    else {
        bloodsugars = await fetch.get(store.url);
        if (store.extraDataUrl) {
            extraData = await fetch.get(store.extraDataUrl);
        }
    }


    Promise.all([bloodsugars, extraData]).then(function (values) {
        const dataToSend = {
            bloodSugars: standardize.bloodsugars(values[0], values[1], store),
            settings: standardize.settings(store),
            // weather: values[2].query.results.channel.item.condition,
        }
        transfer.send(dataToSend);
    });
}


// Listen for messages from the device
messaging.peerSocket.onmessage = function (evt) {
    console.log('Companion -> onmessage: got message from app ' + JSON.stringify(evt.data));
    if (evt.data.command === 'forceCompanionTransfer') {
        dataReceivedFromWatch = evt.data.data;
        sendData()
    }
};

// Listen for the onerror event
messaging.peerSocket.onerror = function (err) {
    // Handle any errors
    console.log("Connection error: " + err.code + " - " + err.message);
};

settingsStorage.onchange = function (evt) {
    logs.add('Line 70: companion - Settings changed send to watch');
    sendData()
    if (evt.key === "authorizationCode") {
        // Settings page sent us an oAuth token
        let data = JSON.parse(evt.newValue);
        dexcom.getAccessToken(data.name);

    }
}

const MINUTE = 1000 * 60;
me.wakeInterval = 5 * MINUTE;

if (me.launchReasons.wokenUp) {
    // The companion started due to a periodic timer
    console.info("Companion launch reason: wokenUp")
    //sendData()
}
else if (me.launchReasons.fileTransfer) {
    console.info("Companion launch reason: fileTransfer")
}
else if (me.launchReasons.peerAppLaunched) {
    console.info("Companion launch reason: peerAppLaunched")
    //sendData()
}
else if (me.launchReasons.settingsChanged) {
    console.info("Companion launch reason: settingsChanged")
}
// else {
//     // Close the companion and wait to be awoken
//     me.yield()
// }

me.onwakeinterval = () => {
    console.info('Companion -> onwakeinterval event')
}

me.onunload = () => {
    const rand = Math.random();
    console.info(`Companion -> onunload event: settingsStorage force refresh with random value ${rand}`);
    transfer.cancel();
    settingsStorage.setItem('refresh', rand);
}

app.onreadystatechange = () => {
    console.log(`Companion -> app.onreadystatechange [${device.modelName}] ${app.readyState}`);
   
    if (app.readyState === 'started') {
        console.log(`Companion -> app.onreadystatechange [${app.readyState}] -> sendData()`);
        sendData()
    }
    else if (app.readyState === 'stopped') {
        //console.log(`Companion -> app.onreadystatechange [${app.readyState}] -> Close the companion and wait to be awoken`);
        // Close the companion and wait to be awoken
        //me.yield()
    }
}

// wait 1 seconds before getting things started
//setTimeout(sendData, 1000);
