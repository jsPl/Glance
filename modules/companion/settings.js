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
import Logs from "./logs.js";
import { defaults } from "../../common/default-settings";

const logs = new Logs();

export default class settings {
    get(dataReceivedFromWatch) {
        let queryParms = '?count=47';
        //logs.add('companion - settings - get()');
        let dataSource = null;

        //console.log('settingsStorage[dataSource] = ' + settingsStorage.getItem('dataSource'))

        if (settingsStorage.getItem('dataSource')) {
            dataSource = JSON.parse(settingsStorage.getItem('dataSource')).values[0].value;
        } 
        else if (!dataSource) {

            dataSource = defaults.dataSource;
            console.log('settingsStorage[dataSource] defaults = ' + dataSource)


            settingsStorage.setItem("dataSource", JSON.stringify({ "selected": [0], "values": [{ "name": defaults.dataSourceName, "value": dataSource }] }));
        }

        let url = defaults.url + queryParms;
        let extraDataUrl = null;
        
        if (dataSource === 'nightscout') { // Nightscout
            let nightscoutSiteName = null;
            if (settingsStorage.getItem('nightscoutSiteName') && JSON.parse(settingsStorage.getItem('nightscoutSiteName')).name) {
                nightscoutSiteName = JSON.parse(settingsStorage.getItem('nightscoutSiteName')).name;
                if (isURL(nightscoutSiteName)) {
                    nightscoutSiteName = nightscoutSiteName.split('.')[0];
                    nightscoutSiteName = nightscoutSiteName.split('//')[1];
                    //console.log((nightscoutSiteName))
                }
            } else if (!nightscoutSiteName) {
                nightscoutSiteName = 'placeholder';
                settingsStorage.setItem("nightscoutSiteName", JSON.stringify({ "name": '' }));
            }
            let nightscoutSiteHost = null;
            if (settingsStorage.getItem('nightscoutSiteHost')) {
                nightscoutSiteHost = JSON.parse(settingsStorage.getItem('nightscoutSiteHost')).values[0].value;
            } else if (!nightscoutSiteHost) {
                nightscoutSiteHost = 'herokuapp.com';
                settingsStorage.setItem("nightscoutSiteHost", JSON.stringify({ "selected": [0], "values": [{ "name": 'Heroku', "value": 'herokuapp.com' }] }));
            }

            url = 'https://' + nightscoutSiteName.toLowerCase() + '.' + nightscoutSiteHost + '/pebble' + queryParms;
            extraDataUrl = 'https://' + nightscoutSiteName.toLowerCase() + '.' + nightscoutSiteHost + '/api/v2/properties';
        } 
        else if (dataSource === 'xdrip') { // xDrip+
            if (dataReceivedFromWatch && dataReceivedFromWatch != null) {
                queryParms = `?count=47&steps=${dataReceivedFromWatch.steps}&heart=${dataReceivedFromWatch.heart}`;
            }
            url = 'http://127.0.0.1:17580/sgv.json' + queryParms;
        } 
        else if (dataSource === 'spike') { // spike 
            url = 'http://127.0.0.1:1979/pebble' + queryParms;
            // local spike addr for my comp
            // url = 'http://192.168.86.91:1979/pebble' + queryParms;     
        } 
        else if (dataSource === 'custom') {
            url = JSON.parse(settingsStorage.getItem('customEndpoint')).name + queryParms;
            // 47 42
        } 
        else if (dataSource === 'dexcom') {
            url = 'dexcom';
        } 
        else if (dataSource === 'tomato') { // tomato
            url = 'http://127.0.0.1:11111' + queryParms;
        }

        let glucoseUnits = null;
        if (settingsStorage.getItem('glucoseUnits')) {
            glucoseUnits = JSON.parse(settingsStorage.getItem('glucoseUnits')).values[0].value;
        } 
        else if (!glucoseUnits) {
            glucoseUnits = defaults.glucoseUnits;
            settingsStorage.setItem("glucoseUnits", JSON.stringify({ "selected": [0], "values": [{ "name": glucoseUnits, "value": glucoseUnits }] }));
        }

        let highThreshold = null;
        if (settingsStorage.getItem('highThreshold')) {
            highThreshold = JSON.parse(settingsStorage.getItem('highThreshold')).name;
        } 
        else if (!highThreshold) {
            highThreshold = defaults.highThreshold;
            settingsStorage.setItem("highThreshold", JSON.stringify({ "name": highThreshold }));
        }

        let lowThreshold = null;
        if (settingsStorage.getItem('lowThreshold')) {
            lowThreshold = JSON.parse(settingsStorage.getItem('lowThreshold')).name;
        } 
        else if (!lowThreshold) {
            lowThreshold = defaults.lowThreshold;
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

        let dismissHighFor = null;
        if (settingsStorage.getItem('dismissHighFor')) {
            dismissHighFor = JSON.parse(settingsStorage.getItem('dismissHighFor')).name;
        } 
        else if (!dismissHighFor) {
            dismissHighFor = defaults.dismissHighFor;
            settingsStorage.setItem("dismissHighFor", JSON.stringify({ "name": dismissHighFor }));
        }

        let dismissLowFor = null;
        if (settingsStorage.getItem('dismissLowFor')) {
            dismissLowFor = JSON.parse(settingsStorage.getItem('dismissLowFor')).name;
        } 
        else if (!dismissLowFor) {
            dismissLowFor = defaults.dismissLowFor;
            settingsStorage.setItem("dismissLowFor", JSON.stringify({ "name": dismissLowFor }));
        }

        let disableAlert = null;
        if (settingsStorage.getItem('disableAlert')) {
            disableAlert = JSON.parse(settingsStorage.getItem('disableAlert'));
        } 
        else if (!disableAlert) {
            disableAlert = defaults.disableAlert;
        }

        let highAlerts = null;
        if (settingsStorage.getItem('highAlerts')) {
            highAlerts = JSON.parse(settingsStorage.getItem('highAlerts'));
        } 
        else if (!highAlerts) {
            highAlerts = defaults.highAlerts;
            settingsStorage.setItem("highAlerts", highAlerts);
        }


        let lowAlerts = null;
        if (settingsStorage.getItem('lowAlerts')) {
            lowAlerts = JSON.parse(settingsStorage.getItem('lowAlerts'));
        } 
        else if (!lowAlerts) {
            lowAlerts = defaults.lowAlerts;
            settingsStorage.setItem("lowAlerts", lowAlerts);
        }

        let rapidRise = null;
        if (settingsStorage.getItem('rapidRise')) {
            rapidRise = JSON.parse(settingsStorage.getItem('rapidRise'));
        } 
        else if (!rapidRise) {
            rapidRise = defaults.rapidRise;
            settingsStorage.setItem("rapidRise", rapidRise);
        }

        let rapidFall = null;
        if (settingsStorage.getItem('rapidFall')) {
            rapidFall = JSON.parse(settingsStorage.getItem('rapidFall'));
        } 
        else if (!rapidFall) {
            rapidFall = defaults.rapidFall;
            settingsStorage.setItem("rapidFall", rapidFall);
        }

        let timeFormat = null;
        if (settingsStorage.getItem('timeFormat')) {
            timeFormat = JSON.parse(settingsStorage.getItem('timeFormat')).values[0].value;
        } 
        else if (!timeFormat) {
            timeFormat = defaults.timeFormat;
            const timeFormatName = timeFormat ? '24h' : '12h';
            settingsStorage.setItem("timeFormat", JSON.stringify({ "selected": [0], "values": [{ "name": timeFormatName, "value": timeFormat }] }));
        }

        let dateFormat = null;
        if (settingsStorage.getItem('dateFormat')) {
            dateFormat = JSON.parse(settingsStorage.getItem('dateFormat')).values[0].value;
        } 
        else if (!dateFormat) {
            dateFormat = defaults.dateFormat;
            settingsStorage.setItem("dateFormat", JSON.stringify({ "selected": [0], "values": [{ "name": dateFormat, "value": dateFormat }] }));
        }

        let tempType = null;
        if (settingsStorage.getItem('tempType')) {
            tempType = JSON.parse(settingsStorage.getItem('tempType')).values[0].value;
        } 
        else if (!tempType) {
            tempType = defaults.tempName;
            const tempName = tempType === 'f' ? 'Fahrenheit' : 'Celsius';
            settingsStorage.setItem("tempType", JSON.stringify({ "selected": [0], "values": [{ "name": tempName, "value": tempType }] }));
        }

        let bgColor = null;
        let bgColorTwo = defaults.bgColorTwo;

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
                } else {
                    bgColor = validateHexCode(JSON.parse(settingsStorage.getItem('hexColor')).name.replace(/ /g, ""), false);
                    bgColorTwo = validateHexCode(JSON.parse(settingsStorage.getItem('hexColorTwo')).name.replace(/ /g, ""), false);
                    settingsStorage.setItem("hexColor", JSON.stringify({ "name": bgColor }));
                    settingsStorage.setItem("hexColorTwo", JSON.stringify({ "name": bgColorTwo }));

                }
            }
        } 
        else if (!bgColor) {
            bgColor = defaults.bgColor;
        }


        let textColor = null;
        if (settingsStorage.getItem('textColor')) {
            textColor = validateHexCode(JSON.parse(settingsStorage.getItem('textColor')).name.replace(/ /g, ""), true);
            settingsStorage.setItem("textColor", JSON.stringify({ "name": textColor }));
        } 
        else if (!textColor) {
            textColor = defaults.textColor;
            settingsStorage.setItem("textColor", JSON.stringify({ "name": textColor }));
        }

        let largeGraph = null;
        if (settingsStorage.getItem('largeGraph')) {
            largeGraph = JSON.parse(settingsStorage.getItem('largeGraph'));
        } 
        else if (!largeGraph) {
            largeGraph = defaults.largeGraph;
            settingsStorage.setItem("largeGraph", largeGraph);
        }

        let treatments = null;
        if (settingsStorage.getItem('treatments')) {
            treatments = JSON.parse(settingsStorage.getItem('treatments'));
        } 
        else if (!treatments) {
            treatments = defaults.treatments;
        }

        let layoutOne = null;
        if (settingsStorage.getItem('layoutOne') && JSON.parse(settingsStorage.getItem('layoutOne')).values) {
            layoutOne = JSON.parse(settingsStorage.getItem('layoutOne')).values[0].value;
        } 
        else if (!layoutOne) {
            layoutOne = 'iob';
            settingsStorage.setItem("layoutOne", JSON.stringify({ "selected": [0], "values": [{ name: "Insulin on board (default)", value: "iob" }] }));
        }

        let layoutTwo = null;
        if (settingsStorage.getItem('layoutTwo') && JSON.parse(settingsStorage.getItem('layoutTwo')).values) {
            layoutTwo = JSON.parse(settingsStorage.getItem('layoutTwo')).values[0].value;
        } 
        else if (!layoutTwo) {
            layoutTwo = 'cob';
            settingsStorage.setItem("layoutTwo", JSON.stringify({ "selected": [0], "values": [{ name: "Carbs on board (default)", value: "cob" }] }));
        }

        let layoutThree = null;
        if (settingsStorage.getItem('layoutThree') && JSON.parse(settingsStorage.getItem('layoutThree')).values) {
            layoutThree = JSON.parse(settingsStorage.getItem('layoutThree')).values[0].value;
        } 
        else if (!layoutThree) {
            layoutThree = 'step';
            settingsStorage.setItem("layoutThree", JSON.stringify({ "selected": [0], "values": [{ name: "steps (default)", value: "steps" }] }));
        }

        let layoutFour = null;
        if (settingsStorage.getItem('layoutFour') && JSON.parse(settingsStorage.getItem('layoutFour')).values) {
            layoutFour = JSON.parse(settingsStorage.getItem('layoutFour')).values[0].value;
        } 
        else if (!layoutFour) {
            layoutFour = 'heart';
            settingsStorage.setItem("layoutFour", JSON.stringify({ "selected": [0], "values": [{ name: "heart (default)", value: "heart" }] }));
        }

        let enableSmallGraphPrediction = null;
        if (settingsStorage.getItem('enableSmallGraphPrediction')) {
            enableSmallGraphPrediction = JSON.parse(settingsStorage.getItem('enableSmallGraphPrediction'));
        } 
        else if (!enableSmallGraphPrediction) {
            enableSmallGraphPrediction = true
            settingsStorage.setItem("enableSmallGraphPrediction", enableSmallGraphPrediction);
        }

        let loopstatus = null;
        if (settingsStorage.getItem('loopstatus')) {
            loopstatus = JSON.parse(settingsStorage.getItem('loopstatus'));
        } 
        else if (!loopstatus) {
            loopstatus = true;
            settingsStorage.setItem("loopstatus", loopstatus);
        }

        let enableDOW = null;
        if (settingsStorage.getItem('enableDOW')) {
            enableDOW = JSON.parse(settingsStorage.getItem('enableDOW'));
        } 
        else if (!enableDOW) {
            enableDOW = defaults.enableDOW;
            settingsStorage.setItem("enableDOW", enableDOW);
        }


        let dexcomUsername = null;
        if (settingsStorage.getItem('dexcomUsername')) {
            //console.log(settingsStorage.getItem('dexcomUsername'))
            dexcomUsername = JSON.parse(settingsStorage.getItem('dexcomUsername')).name;
        } else if (!dexcomUsername) {
            dexcomUsername = null;
            settingsStorage.setItem("dexcomUsername", JSON.stringify({ "name": dexcomUsername }));
        }

        let dexcomPassword = null;
        if (settingsStorage.getItem('dexcomPassword')) {
            //console.log(settingsStorage.getItem('dexcomPassword'))
            dexcomPassword = JSON.parse(settingsStorage.getItem('dexcomPassword')).name;
        } else if (!dexcomPassword) {
            dexcomPassword = null;
            settingsStorage.setItem("dexcomPassword", JSON.stringify({ "name": dexcomPassword }));
        }

        let USAVSInternational = null;
        if (settingsStorage.getItem('USAVSInternational')) {
            USAVSInternational = JSON.parse(settingsStorage.getItem('USAVSInternational'));
        } else if (!USAVSInternational) {
            USAVSInternational = false;
        }

        let resetAlertDismissal = null;
        if (settingsStorage.getItem('resetAlertDismissal')) {
            resetAlertDismissal = JSON.parse(settingsStorage.getItem('resetAlertDismissal'));
        } 
        else if (!resetAlertDismissal) {
            resetAlertDismissal = defaults.resetAlertDismissal;
            settingsStorage.setItem("resetAlertDismissal", resetAlertDismissal);
        }

        let staleData = null;
        if (settingsStorage.getItem('staleData')) {
            staleData = JSON.parse(settingsStorage.getItem('staleData'));
        } 
        else if (!staleData) {
            staleData = defaults.staleData;
            settingsStorage.setItem("staleData", staleData);
        }

        let staleDataAlertAfter = null;
        if (settingsStorage.getItem('staleDataAlertAfter')) {
            staleDataAlertAfter = JSON.parse(settingsStorage.getItem('staleDataAlertAfter')).name;
        } 
        else if (!staleDataAlertAfter) {
            staleDataAlertAfter = defaults.staleDataAlertAfter;
            settingsStorage.setItem("staleDataAlertAfter", JSON.stringify({ "name": staleDataAlertAfter }));
        }


        let settings = {
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
        //ogs.add('Line ~183 setToggle()')
        settingsStorage.setItem(key, value);
    };
};


// converts a mg/dL to mmoL
function mmol(bg, roundToHundredths) {
    return (Math.round((bg / 18) * 10) / 10).toFixed(1);
}

// converts mmoL to  mg/dL 
function mgdl(bg) {
    let mgdlBG = (Math.round(bg * 18.018).toFixed(0));

    return mgdlBG;
}

function isURL(s) {
    var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
    return regexp.test(s);
}

function validateHexCode(code, text) {
    var isOk = /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(code);
    //console.log(isOk)
    if (isOk) {
        logs.add('companion - validateHexCode - Hex code valid');
        return code;
    }
    logs.add(`companion - validateHexCode - Error with hex code set to black (#000000) user entered ${code}`);
    if (text) {
        return '#ffffff';
    }
    return '#000000';
}