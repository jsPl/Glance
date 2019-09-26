import { peerSocket } from 'messaging';

export const defaults = {
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
    [peerSocket.CLOSED]: 'CLOSE'
}