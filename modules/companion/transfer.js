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
import { outbox } from "file-transfer";
import { encode } from 'cbor';
import * as messaging from "messaging";

const FILE_TRANSFER_MAX_RETRIES = 5;

class Transfer {
    constructor() {
        this.handleOnMessage = function(){};
        this.handleMessageSent = function(){};

        messaging.peerSocket.onopen = () => {
            console.log('Companion -> messsaging -> socket open');
        }
        messaging.peerSocket.onclose = evt => {
            console.log(`Companion -> messaging -> socket close: ${evt.reason} [code: ${evt.code}] wasClean: ${evt.wasClean}`);
        }
        messaging.peerSocket.onerror = evt => {
            console.log(`Companion -> messaging -> socket error: ${evt.message} [code: ${evt.code}]`);
        }
        messaging.peerSocket.onmessage = evt => {
            console.log('Companion -> messaging -> onmessage from app: ' + JSON.stringify(evt.data));
            this.handleOnMessage(evt);
        }
    }

    onMessage(callback) { 
        this.handleOnMessage = callback;
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
        console.log(`Companion -> File transfer -> enqueueing ${filename}`)

        outbox.enqueue(filename, encode(data))
            .then(ft => {
                ft.onchange = evt => {
                    console.log(`Companion -> File transfer -> Transfer state change of ${ft.name} [${ft.readyState}]`)
                }
                console.log(`Companion -> File transfer -> Transfer of ${ft.name} successfully queued [${ft.readyState}]`);
            })
            .catch(error => {
                console.log(`Companion -> File transfer -> Error: Failed to queue ${filename}: ${error}`);
                if (retry < FILE_TRANSFER_MAX_RETRIES) {
                    //this.send(data, ++retry)
                }
            })
    }

    sendMessage(data) {
        console.log(`Companion -> messaging -> send [${this.socketState()}]`)

        if (this.socketState() === 'OPEN') {
            try {
                messaging.peerSocket.send(data);
                this.handleMessageSent()
            }
            catch (err) {
                console.error(err)
            }
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

    socketState() {
        const isOpen = messaging.peerSocket.readyState === messaging.peerSocket.OPEN;
        const isClosed = messaging.peerSocket.readyState === messaging.peerSocket.CLOSED;
        return isOpen ? 'OPEN' : (isClosed ? 'CLOSED' : 'WAIT');
    }
}

export let transfer = new Transfer()