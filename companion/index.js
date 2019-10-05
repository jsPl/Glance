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
import { me } from "companion";
import { app, device } from "peer";

const SECOND = 1000; // ms
const MINUTE = SECOND * 60;

const settings = new Settings();
const fetch = new Fetch();
const standardize = new Standardize();

let dataReceivedFromWatch = null;
let store = settings.get(dataReceivedFromWatch);

transfer.onMessageReceived(function ({ data }) {
    const { cmd, payload } = data;
    if (cmd === 'FORCE_COMPANION_TRANSFER') {
        dataReceivedFromWatch = payload;
        sendData()

        // if (dataReceivedFromWatch.reason === 'Initial transfer request from App') {
        //     transfer.enumerate().then(fileTransfers => {
        //         //console.log(`Panding transfers: ${fileTransfers.length}`)
        //         if (fileTransfers.length === 0) {
        //             sendData()
        //         }
        //     })
        // }
        // else {
        //     sendData()
        // }
    }
    else if (cmd === 'XDRIP_ALERT_SNOOZE') {
        snoozeXdripAlert()
    }
})

async function snoozeXdripAlert() {
    console.log(`Companion -> Snooze xDrip alert`)
    await fetch.get(store.url, { tasker: 'snooze' });
    transfer.sendMessage({ cmd: 'XDRIP_ALERT_SNOOZE_SUCCESS' })
}

async function sendData({ settingsChanged = false } = {}) {
    // Get SGV data
    let bloodsugars = await fetch.get(store.url);
    let extraData = null;

    if (store.extraDataUrl) {
        extraData = await fetch.get(store.extraDataUrl);
    }

    const bgReading = Array.isArray(bloodsugars) && bloodsugars.length > 0 ?
        bloodsugars[0] : {};

    const isBgReadingMatch = dataReceivedFromWatch && dataReceivedFromWatch.lastBgTime === bgReading.date;

    if (isBgReadingMatch && dataReceivedFromWatch.reason !== 'force refresh') {
        console.log(`Companion -> sendData [SKIPPING], last bg time on watch match phone reading: ${bgReading.date}`)
        setTimeout(sendData, 30 * SECOND);
        transfer.sendMessage({ cmd: 'BG_READING_MATCH' })
        return;
    }

    const dataToSend = {
        bloodSugars: standardize.bloodsugars(bloodsugars, extraData, store),
        settings: settingsChanged && standardize.settings(store) || null
    }
    transfer.sendFile(dataToSend);
}

settingsStorage.onchange = function ({ key, oldValue, newValue }) {
    console.log(`Companion -> settingsStorage -> change [${key}]: ${oldValue} -> ${newValue}`)
    store = settings.get(dataReceivedFromWatch);
    sendData({ settingsChanged: true });
}

//me.wakeInterval = 5 * MINUTE;

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

me.onwakeinterval = () => {
    console.info('Companion -> onwakeinterval event')
}

me.onunload = () => {
    console.info(`Companion -> onunload event`);
    transfer.cancel();
}

app.onreadystatechange = () => {
    let txt = `Companion -> App.onreadystatechange [${device.modelName}] ${app.readyState}`;

    if (app.readyState === 'started') {
        txt += ' -> sendData()';
        sendData();
        me.wakeInterval = 5 * MINUTE;
    }
    else if (app.readyState === 'stopped') {
        if (transfer.getSocketClosedCleanly() === true) {
            // TODO disable wakeInterval only of watch is switched off (if possible to determine)
            setTimeout(function () {
                me.wakeInterval = undefined;
            }, 20 * SECOND)
        }
        else {
            txt += `: socket wasn't closed cleanly`
        }
    }
    console.log(txt);
}

transfer.processIncomingFiles()

if (me.host.app.name === 'unknown') {
    // Running on Simulator
    console.log(`Companion -> Running on Simulator`)
    setTimeout(sendData, 1000)
}