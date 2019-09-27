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
import { defaultSettings, mmol, mgdl } from "../../common";

export default class settings {
    get(dataReceivedFromWatch) {
        let queryParms = '?count=47';
        let dataSource = defaultSettings.dataSource;

        if (settingsStorage.getItem('dataSource')) {
            dataSource = JSON.parse(settingsStorage.getItem('dataSource')).values[0].value;
        }
        else {
            settingsStorage.setItem("dataSource", JSON.stringify({ "selected": [0], "values": [{ "name": defaultSettings.dataSourceName, "value": dataSource }] }));
        }

        let url = defaultSettings.url + queryParms;
        let extraDataUrl = null;

        if (dataSource === 'xdrip') {
            if (dataReceivedFromWatch) {
                queryParms = `?count=47&steps=${dataReceivedFromWatch.steps}&heart=${dataReceivedFromWatch.heart}`;
            }
            url = 'http://127.0.0.1:17580/sgv.json' + queryParms;
        }
        else if (dataSource === 'custom') {
            url = JSON.parse(settingsStorage.getItem('customEndpoint')).name + queryParms;
        }

        let glucoseUnits = defaultSettings.glucoseUnits;
        if (settingsStorage.getItem('glucoseUnits')) {
            glucoseUnits = JSON.parse(settingsStorage.getItem('glucoseUnits')).values[0].value;
        }
        else {
            settingsStorage.setItem("glucoseUnits", JSON.stringify({ "selected": [0], "values": [{ "name": glucoseUnits, "value": glucoseUnits }] }));
        }

        let highThreshold = defaultSettings.highThreshold;
        if (settingsStorage.getItem('highThreshold')) {
            highThreshold = JSON.parse(settingsStorage.getItem('highThreshold')).name;
        }
        else {
            settingsStorage.setItem("highThreshold", JSON.stringify({ "name": highThreshold }));
        }

        let lowThreshold = defaultSettings.lowThreshold;
        if (settingsStorage.getItem('lowThreshold')) {
            lowThreshold = JSON.parse(settingsStorage.getItem('lowThreshold')).name;
        }
        else {
            settingsStorage.setItem("lowThreshold", JSON.stringify({ "name": lowThreshold }));
        }

        if (glucoseUnits === 'mmol') {
            if (lowThreshold > 25) {
                lowThreshold = mmol(lowThreshold)
                settingsStorage.setItem("lowThreshold", JSON.stringify({ "name": lowThreshold }));
            }
            if (highThreshold > 25) {
                highThreshold = mmol(highThreshold)
                settingsStorage.setItem("highThreshold", JSON.stringify({ "name": highThreshold }));
            }
        }
        if (glucoseUnits === 'mgdl') {
            if (lowThreshold < 25) {
                lowThreshold = mgdl(lowThreshold)
                settingsStorage.setItem("lowThreshold", JSON.stringify({ "name": lowThreshold }));
            }
            if (highThreshold < 25) {
                highThreshold = mgdl(highThreshold)
                settingsStorage.setItem("highThreshold", JSON.stringify({ "name": highThreshold }));
            }
        }

        let dismissHighFor = defaultSettings.dismissHighFor;
        if (settingsStorage.getItem('dismissHighFor')) {
            dismissHighFor = JSON.parse(settingsStorage.getItem('dismissHighFor')).name;
        }
        else {
            settingsStorage.setItem("dismissHighFor", JSON.stringify({ "name": dismissHighFor }));
        }

        let dismissLowFor = defaultSettings.dismissLowFor;
        if (settingsStorage.getItem('dismissLowFor')) {
            dismissLowFor = JSON.parse(settingsStorage.getItem('dismissLowFor')).name;
        }
        else {
            settingsStorage.setItem("dismissLowFor", JSON.stringify({ "name": dismissLowFor }));
        }

        let disableAlert = defaultSettings.disableAlert;
        if (settingsStorage.getItem('disableAlert')) {
            disableAlert = JSON.parse(settingsStorage.getItem('disableAlert'));
        }
        else {
            settingsStorage.setItem("disableAlert", disableAlert);
        }

        let highAlerts = defaultSettings.highAlerts;
        if (settingsStorage.getItem('highAlerts')) {
            highAlerts = JSON.parse(settingsStorage.getItem('highAlerts'));
        }
        else {
            settingsStorage.setItem("highAlerts", highAlerts);
        }

        let lowAlerts = defaultSettings.lowAlerts;
        if (settingsStorage.getItem('lowAlerts')) {
            lowAlerts = JSON.parse(settingsStorage.getItem('lowAlerts'));
        }
        else {
            settingsStorage.setItem("lowAlerts", lowAlerts);
        }

        let rapidRise = defaultSettings.rapidRise;
        if (settingsStorage.getItem('rapidRise')) {
            rapidRise = JSON.parse(settingsStorage.getItem('rapidRise'));
        }
        else {
            settingsStorage.setItem("rapidRise", rapidRise);
        }

        let rapidFall = defaultSettings.rapidFall;
        if (settingsStorage.getItem('rapidFall')) {
            rapidFall = JSON.parse(settingsStorage.getItem('rapidFall'));
        }
        else {
            settingsStorage.setItem("rapidFall", rapidFall);
        }

        let timeFormat = defaultSettings.timeFormat;
        if (settingsStorage.getItem('timeFormat')) {
            timeFormat = JSON.parse(settingsStorage.getItem('timeFormat')).values[0].value;
        }
        else {
            const timeFormatName = timeFormat ? '24h' : '12h';
            settingsStorage.setItem("timeFormat", JSON.stringify({ "selected": [0], "values": [{ "name": timeFormatName, "value": timeFormat }] }));
        }

        let dateFormat = defaultSettings.dateFormat;
        if (settingsStorage.getItem('dateFormat')) {
            dateFormat = JSON.parse(settingsStorage.getItem('dateFormat')).values[0].value;
        }
        else {
            settingsStorage.setItem("dateFormat", JSON.stringify({ "selected": [0], "values": [{ "name": dateFormat, "value": dateFormat }] }));
        }

        let tempType = defaultSettings.tempName;
        if (settingsStorage.getItem('tempType')) {
            tempType = JSON.parse(settingsStorage.getItem('tempType')).values[0].value;
        }
        else {
            const tempName = tempType === 'f' ? 'Fahrenheit' : 'Celsius';
            settingsStorage.setItem("tempType", JSON.stringify({ "selected": [0], "values": [{ "name": tempName, "value": tempType }] }));
        }

        let bgColor = defaultSettings.bgColor;
        let bgColorTwo = defaultSettings.bgColorTwo;

        if (settingsStorage.getItem('bgColor')) {
            bgColor = validateHexCode(JSON.parse(settingsStorage.getItem('bgColor', false)));

            if (bgColor === '#FFFFFF') {
                bgColor = "#" + Math.random().toString(16).slice(2, 8);
                bgColorTwo = "#" + Math.random().toString(16).slice(2, 8);
                let saveColor = null;
                if (settingsStorage.getItem('saveColor')) {
                    saveColor = JSON.parse(settingsStorage.getItem('saveColor'));
                }
                if (!saveColor) {
                    saveColor = false;
                }
                if (!saveColor) {
                    settingsStorage.setItem("hexColor", JSON.stringify({ "name": validateHexCode(bgColor, false) }));
                    settingsStorage.setItem("hexColorTwo", JSON.stringify({ "name": validateHexCode(bgColorTwo, false) }));
                }
                else {
                    bgColor = validateHexCode(JSON.parse(settingsStorage.getItem('hexColor')).name.replace(/ /g, ""), false);
                    bgColorTwo = validateHexCode(JSON.parse(settingsStorage.getItem('hexColorTwo')).name.replace(/ /g, ""), false);
                    settingsStorage.setItem("hexColor", JSON.stringify({ "name": bgColor }));
                    settingsStorage.setItem("hexColorTwo", JSON.stringify({ "name": bgColorTwo }));
                }
            }
        }

        let textColor = defaultSettings.textColor;
        if (settingsStorage.getItem('textColor')) {
            textColor = validateHexCode(JSON.parse(settingsStorage.getItem('textColor')).name.replace(/ /g, ""), true);
            settingsStorage.setItem("textColor", JSON.stringify({ "name": textColor }));
        }
        else {
            settingsStorage.setItem("textColor", JSON.stringify({ "name": textColor }));
        }

        let largeGraph = defaultSettings.largeGraph;
        if (settingsStorage.getItem('largeGraph')) {
            largeGraph = JSON.parse(settingsStorage.getItem('largeGraph'));
        }
        else {
            settingsStorage.setItem("largeGraph", largeGraph);
        }

        let treatments = defaultSettings.treatments;
        if (settingsStorage.getItem('treatments')) {
            treatments = JSON.parse(settingsStorage.getItem('treatments'));
        }

        let layoutOne = 'iob';
        if (settingsStorage.getItem('layoutOne') && JSON.parse(settingsStorage.getItem('layoutOne')).values) {
            layoutOne = JSON.parse(settingsStorage.getItem('layoutOne')).values[0].value;
        }
        else {
            settingsStorage.setItem("layoutOne", JSON.stringify({ "selected": [0], "values": [{ name: "Insulin on board (default)", value: "iob" }] }));
        }

        let layoutTwo = 'cob';
        if (settingsStorage.getItem('layoutTwo') && JSON.parse(settingsStorage.getItem('layoutTwo')).values) {
            layoutTwo = JSON.parse(settingsStorage.getItem('layoutTwo')).values[0].value;
        }
        else {
            settingsStorage.setItem("layoutTwo", JSON.stringify({ "selected": [0], "values": [{ name: "Carbs on board (default)", value: "cob" }] }));
        }

        let layoutThree = 'step';
        if (settingsStorage.getItem('layoutThree') && JSON.parse(settingsStorage.getItem('layoutThree')).values) {
            layoutThree = JSON.parse(settingsStorage.getItem('layoutThree')).values[0].value;
        }
        else {
            settingsStorage.setItem("layoutThree", JSON.stringify({ "selected": [0], "values": [{ name: "steps (default)", value: "steps" }] }));
        }

        let layoutFour = 'heart';
        if (settingsStorage.getItem('layoutFour') && JSON.parse(settingsStorage.getItem('layoutFour')).values) {
            layoutFour = JSON.parse(settingsStorage.getItem('layoutFour')).values[0].value;
        }
        else {
            settingsStorage.setItem("layoutFour", JSON.stringify({ "selected": [0], "values": [{ name: "heart (default)", value: "heart" }] }));
        }

        let enableSmallGraphPrediction = true;
        if (settingsStorage.getItem('enableSmallGraphPrediction')) {
            enableSmallGraphPrediction = JSON.parse(settingsStorage.getItem('enableSmallGraphPrediction'));
        }
        else {
            settingsStorage.setItem("enableSmallGraphPrediction", enableSmallGraphPrediction);
        }

        let loopstatus = true;
        if (settingsStorage.getItem('loopstatus')) {
            loopstatus = JSON.parse(settingsStorage.getItem('loopstatus'));
        }
        else {
            settingsStorage.setItem("loopstatus", loopstatus);
        }

        let enableDOW = defaultSettings.enableDOW;
        if (settingsStorage.getItem('enableDOW')) {
            enableDOW = JSON.parse(settingsStorage.getItem('enableDOW'));
        }
        else {
            settingsStorage.setItem("enableDOW", enableDOW);
        }

        let dexcomUsername = null;
        if (settingsStorage.getItem('dexcomUsername')) {
            dexcomUsername = JSON.parse(settingsStorage.getItem('dexcomUsername')).name;
        }
        else {
            settingsStorage.setItem("dexcomUsername", JSON.stringify({ "name": dexcomUsername }));
        }

        let dexcomPassword = null;
        if (settingsStorage.getItem('dexcomPassword')) {
            dexcomPassword = JSON.parse(settingsStorage.getItem('dexcomPassword')).name;
        }
        else {
            settingsStorage.setItem("dexcomPassword", JSON.stringify({ "name": dexcomPassword }));
        }

        let USAVSInternational = false;
        if (settingsStorage.getItem('USAVSInternational')) {
            USAVSInternational = JSON.parse(settingsStorage.getItem('USAVSInternational'));
        }

        let resetAlertDismissal = defaultSettings.resetAlertDismissal;
        if (settingsStorage.getItem('resetAlertDismissal')) {
            resetAlertDismissal = JSON.parse(settingsStorage.getItem('resetAlertDismissal'));
        }
        else {
            settingsStorage.setItem("resetAlertDismissal", resetAlertDismissal);
        }

        let staleData = defaultSettings.staleData;
        if (settingsStorage.getItem('staleData')) {
            staleData = JSON.parse(settingsStorage.getItem('staleData'));
        }
        else {
            settingsStorage.setItem("staleData", staleData);
        }

        let staleDataAlertAfter = defaultSettings.staleDataAlertAfter;
        if (settingsStorage.getItem('staleDataAlertAfter')) {
            staleDataAlertAfter = JSON.parse(settingsStorage.getItem('staleDataAlertAfter')).name;
        }
        else {
            settingsStorage.setItem("staleDataAlertAfter", JSON.stringify({ "name": staleDataAlertAfter }));
        }

        const settings = {
            url,
            extraDataUrl,
            dataSource,
            highThreshold,
            lowThreshold,
            glucoseUnits,
            disableAlert,
            timeFormat,
            dateFormat,
            tempType,
            bgColor,
            bgColorTwo,
            textColor,
            dismissHighFor,
            dismissLowFor,
            largeGraph,
            treatments,
            highAlerts,
            lowAlerts,
            rapidRise,
            rapidFall,
            layoutOne,
            layoutTwo,
            layoutThree,
            layoutFour,
            enableSmallGraphPrediction,
            loopstatus,
            enableDOW,
            dexcomUsername,
            dexcomPassword,
            USAVSInternational,
            resetAlertDismissal,
            staleData,
            staleDataAlertAfter
        }
        return settings;
    };
    setToggle(key, value) {
        settingsStorage.setItem(key, value);
    };
};

function isURL(s) {
    var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
    return regexp.test(s);
}

function validateHexCode(code, text) {
    var isOk = /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(code);
    if (isOk) {
        return code;
    }
    if (text) {
        return '#ffffff';
    }
    return '#000000';
}