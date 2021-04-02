import { peerSocket, CloseCode } from 'messaging';

export const defaultSettings = {
    url: 'http://127.0.0.1:17580/sgv.json',
    extraDataUrl: null,
    dataSource: 'xdrip',
    dataSourceName: 'xDrip+',
    highThreshold: 190,
    lowThreshold: 75,
    glucoseUnits: 'mgdl',
    disableAlert: false,
    highAlerts: true,
    lowAlerts: true,
    timeFormat: true,
    dateFormat: 'DD/MM/YYYY',
    tempType: 'c',
    bgColor: '#000000',
    bgColorTwo: '#000000',
    textColor: '#ffffff',
    dismissHighFor: 120,
    dismissLowFor: 20,
    largeGraph: true,
    treatments: false,
    resetAlertDismissal: true,
    staleData: true,
    staleDataAlertAfter: 25,
    enableDOW: true,
    rapidRise: false,
    rapidFall: true
}

export const socketCodes = {
    [peerSocket.CONNECTION_LOST]: 'CONN_LOST',
    [peerSocket.PEER_INITIATED]: 'PEER_INITIATED',
    [peerSocket.SOCKET_ERROR]: 'ERROR',
    [peerSocket.BUFFER_FULL]: 'BUFFER_FULL',
    [peerSocket.OPEN]: 'OPEN',
    [peerSocket.CLOSED]: 'CLOSE',
    [CloseCode.CONNECTION_LOST]: 'CONNECTION_LOST'
}

export const TRANSFER_CMD = {
    XDRIP_ALERT_SNOOZE: 'XDRIP_ALERT_SNOOZE',
    XDRIP_ALERT_SNOOZE_SUCCESS: 'XDRIP_ALERT_SNOOZE_SUCCESS',
    BG_READING_MATCH: 'BG_READING_MATCH',
    FORCE_COMPANION_TRANSFER: 'FORCE_COMPANION_TRANSFER',
    PING: 'PING',
    BG_READING: 'BG_READING',
    BG_READING_MATCH: 'BG_READING_MATCH'
}

export const TRANSFER_REASON = {
    FORCE_REFRESH: 'force refresh',
    SOCKET_OPEN_BUT_NO_SGV_DATA_TRANSFERED: 'Socket open but no SGV data transfered'
}

export function shallowObjectCopy(srcObj, props) {
    let objCopy = {};
    let key;

    for (key in srcObj) {
        objCopy[key] = srcObj[key];
    }
    for (key in props) {
        objCopy[key] = props[key]
    }
    return objCopy;
}

// converts a mg/dL to mmoL
export function mmol(bg) {
    return (Math.round((bg / 18) * 10) / 10).toFixed(1);
}

// converts mmoL to  mg/dL 
export function mgdl(bg) {
    let mgdlBG = Math.round(bg * 18.018).toFixed(0);
    return mgdlBG;
}
