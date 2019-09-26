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
import { transfer } from "../modules/companion/transfer.js";
import Fetch from "../modules/companion/fetch.js";
import Standardize from "../modules/companion/standardize.js";
// import Weather from "../modules/companion/weather.js";
//import Logs from "../modules/companion/logs.js";
//import Sizeof from "../modules/companion/sizeof.js";
import Dexcom from "../modules/companion/dexcom.js";

//import * as messaging from "messaging";
import { me } from "companion";
import { app, device } from "peer";

const SECOND = 1000; // ms
const MINUTE = SECOND * 60;

const settings = new Settings();
const fetch = new Fetch();
const standardize = new Standardize();
const dexcom = new Dexcom();

// const weatherURL = new Weather();
//const logs = new Logs();
//const sizeof = new Sizeof();
let dataReceivedFromWatch = null;

transfer.onMessage(function (evt) {
    if (evt.data.cmd === 'forceCompanionTransfer') {
        dataReceivedFromWatch = evt.data.data;
        sendData()
    }
})

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
            bloodsugars = { error: { status: "500" } }
        }
    }
    else {
        bloodsugars = await fetch.get(store.url);
        if (store.extraDataUrl) {
            extraData = await fetch.get(store.extraDataUrl);
        }
    }

    const bgReading = Array.isArray(bloodsugars) && bloodsugars.length > 0 ?
        bloodsugars[0] : null;

    //console.log('comp -> bloodsugars ' + JSON.stringify(bgReading))
    if (dataReceivedFromWatch
        && dataReceivedFromWatch.lastBgTime === bgReading.date
        && dataReceivedFromWatch.reason !== 'force refresh') {
        console.log(`Companion -> sendData [SKIPPING], last bg time on watch match phone reading: ${bgReading.date}`)
        setTimeout(sendData, 30 * SECOND);
        transfer.sendMessage({ cmd: 'BG_READING_MATCH' })
        return;
    }

    Promise.all([bloodsugars, extraData]).then(function (values) {
        const dataToSend = {
            bloodSugars: standardize.bloodsugars(values[0], values[1], store),
            settings: standardize.settings(store)
        }
        transfer.sendFile(dataToSend);
    });
}

settingsStorage.onchange = function (evt) {
    //logs.add('Line 70: companion - Settings changed send to watch');
    sendData()
    // if (evt.key === "authorizationCode") {
    //     // Settings page sent us an oAuth token
    //     let data = JSON.parse(evt.newValue);
    //     dexcom.getAccessToken(data.name);
    // }
}

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
    console.info(`Companion -> onunload event`);
    transfer.cancel();
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
