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
import { outbox, inbox } from "file-transfer";
import { encode } from 'cbor';
import * as messaging from "messaging";
import { socketCodes } from '../../common';

const FILE_TRANSFER_MAX_RETRIES = 5;

class Transfer {
    socketClosedCleanly;

    constructor() {
        this.handleOpen = function () { };
        this.handleClose = function () { };
        this.handleError = function () { };
        this.handleMessageSent = function () { };
        this.handleOnMessageReceived = function () { };

        messaging.peerSocket.onopen = evt => {
            console.log(`Companion -> messaging -> socket [OPEN]`);
            this.socketClosedCleanly = undefined;
            this.handleOpen(evt)
        }
        messaging.peerSocket.onclose = evt => {
            console.log(`Companion -> messaging -> socket [CLOSE], code: ${evt.code} ${socketCodes[evt.code]}, reason: ${evt.reason}, wasClean: ${evt.wasClean}`);
            this.socketClosedCleanly = evt.wasClean;
            this.handleClose(evt)
        }
        messaging.peerSocket.onerror = evt => {
            console.log(`Companion -> messaging -> socket [ERROR], code: ${evt.code} ${socketCodes[evt.code]}, message: ${evt.message}`);
            this.handleError(evt)
        }
        messaging.peerSocket.onmessage = evt => {
            console.log('Companion -> messaging -> onmessage from app: ' + JSON.stringify(evt.data));
            this.handleOnMessageReceived(evt);
        }

        inbox.addEventListener('newfile', this.processIncomingFiles);
    }

    onMessageReceived(callback) {
        this.handleOnMessageReceived = callback;
        return this;
    }

    onMessageSent(callback) {
        this.handleMessageSent = callback;
        return this;
    }

    // Send data to the watchface
    sendFile(data, retry = 0) {
        const filename = 'response2.json';
        if (retry > 0) {
            console.log(`Companion -> File transfer -> retrying ${retry}/${FILE_TRANSFER_MAX_RETRIES}`)
        }
        console.log(`Companion -> File transfer -> ${filename} [enqueueing]`)

        outbox.enqueue(filename, encode(data))
            .then(ft => {
                console.log(`Companion -> File transfer -> ${ft.name} [${ft.readyState}]`);
                ft.onchange = evt => {
                    console.log(`Companion -> File transfer -> ${ft.name} [${ft.readyState}]`)
                }
            })
            .catch(error => {
                console.log(`Companion -> File transfer -> Error: Failed to queue ${filename}: ${error}`);
                if (retry < FILE_TRANSFER_MAX_RETRIES) {
                    //this.send(data, ++retry)
                }
            })
    }

    sendMessage(data = { cmd: '', payload: {} }) {
        if (this.socketState() === 'OPEN') {
            try {
                messaging.peerSocket.send(data);
                this.handleMessageSent(data)
            }
            catch (err) {
                console.error(err)
            }
        }
        else {
            console.log(`Companion -> messaging -> send [${this.socketState()}]`)
        }
    }

    cancel() {
        outbox.enumerate()
            .then(fileTransfers => {
                console.log(`Companion -> File transfer -> Cancelling file transfers:`);

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

    async processIncomingFiles() {
        let file;
        while ((file = await inbox.pop())) {
            const payload = await file.cbor();
            console.log(`Companion -> File transfer -> Inbox: ${JSON.stringify(payload)}`);
        }
    }
}

export let transfer = new Transfer()