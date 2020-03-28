import * as messaging from "messaging";
import { encode } from 'cbor';
import { socketCodes } from './index';
import { outbox } from "file-transfer";

const FILE_TRANSFER_MAX_RETRIES = 2;

export default class Transfer {
    socketClosedCleanly;

    constructor(moduleName) {
        this.moduleName = moduleName;
        this.handleOpen = function () { };
        this.handleClose = function () { };
        this.handleError = function () { };
        this.handleMessageSent = function () { };
        this.handleMessageReceived = function () { };
        this.handleFileDataReceived = function () { };

        messaging.peerSocket.onopen = evt => {
            console.log(`${this.moduleName} -> messaging -> socket [OPEN]`);
            this.socketClosedCleanly = undefined;
            this.handleOpen(evt)
        }
        messaging.peerSocket.onclose = evt => {
            console.log(`${this.moduleName} -> messaging -> socket [CLOSE], code: ${evt.code} ${socketCodes[evt.code]}, reason: ${evt.reason}, wasClean: ${evt.wasClean}`);
            this.socketClosedCleanly = evt.wasClean;
            this.handleClose(evt)
        }
        messaging.peerSocket.onerror = evt => {
            console.log(`${this.moduleName} -> messaging -> socket [ERROR], code: ${evt.code} ${socketCodes[evt.code]}, message: ${evt.message}`);
            this.handleError(evt)
        }
        messaging.peerSocket.onmessage = evt => {
            console.log(`${this.moduleName} -> messaging -> onmessage from app: ` + JSON.stringify(evt.data));
            this.handleMessageReceived(evt);
        }
    }

    onOpen(callback) {
        this.handleOpen = callback;
        return this;
    }

    onClose(callback) {
        this.handleClose = callback;
        return this;
    }

    onError(callback) {
        this.handleError = callback;
        return this;
    }

    onMessageReceived(callback) {
        this.handleMessageReceived = callback;
        return this;
    }

    onMessageSent(callback) {
        this.handleMessageSent = callback;
        return this;
    }

    onFileDataReceived(callback) {
        this.handleFileDataReceived = callback;
        return this;
    }

    // Send data via file transfer
    sendFile(data, filename, retry = 0) {
        if (retry > 0) {
            console.log(`${this.moduleName} -> File transfer -> retrying ${retry}/${FILE_TRANSFER_MAX_RETRIES}`)
        }
        console.log(`${this.moduleName} -> File transfer -> ${filename} [enqueueing]`)

        outbox.enqueue(filename, encode(data))
            .then(ft => {
                console.log(`${this.moduleName} -> File transfer -> ${ft.name} [${ft.readyState}]`);
                ft.onchange = evt => {
                    console.log(`${this.moduleName} -> File transfer -> ${ft.name} [${ft.readyState}]`)
                }
            })
            .catch(error => {
                console.log(`${this.moduleName} -> File transfer -> Error: Failed to queue ${filename}: ${error}`);
                if (retry < FILE_TRANSFER_MAX_RETRIES) {
                    setTimeout(this.sendFile, 5000, data, filename, ++retry)
                }
            })
    }

    // Send data via socket
    sendMessage(data = { cmd: '', payload: {} }) {
        if (this.socketState() === 'OPEN') {
            try {
                messaging.peerSocket.send(data);
                this.handleMessageSent(data);
                return true
            }
            catch (err) {
                console.error(err)
            }
        }
        else {
            console.log(`${this.moduleName} -> messaging -> send [${this.socketState()}]`)
        }
        return false
    }

    cancelFileTransfers() {
        outbox.enumerate()
            .then(fileTransfers => {
                console.log(`${this.moduleName} -> File transfer -> Cancelling file transfers:`);

                fileTransfers.forEeach(ft => {
                    console.log(` ${ft.name} [${ft.readyState}]`);
                    ft.cancel();
                })
            })
    }

    enumerate() {
        return outbox.enumerate()
    }

    socketState() {
        return socketCodes[messaging.peerSocket.readyState] || '?'
    }

    getSocketClosedCleanly() {
        return this.socketClosedCleanly || '?';
    }
}