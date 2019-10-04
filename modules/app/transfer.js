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
import * as messaging from "messaging";
import { outbox } from "file-transfer";
import { me } from "appbit";
import { encode } from 'cbor';
import { socketCodes } from '../../common';

class Transfer {
    constructor() {
        this.handleOpen = function () { };
        this.handleClose = function () { };
        this.handleError = function () { };
        this.handleMessageSent = function () { };
        this.handleOnMessageReceived = function () { };

        messaging.peerSocket.onopen = evt => {
            console.log(`App -> messaging -> socket [OPEN]`);
            this.handleOpen(evt)
        }
        messaging.peerSocket.onclose = evt => {
            console.log(`App -> messaging -> socket [CLOSE], code: ${evt.code} ${socketCodes[evt.code]}, reason: ${evt.reason}, wasClean: ${evt.wasClean}`);
            this.handleClose(evt)
        }
        messaging.peerSocket.onerror = evt => {
            console.log(`App -> messaging -> socket [ERROR], code: ${evt.code} ${socketCodes[evt.code]}, message: ${evt.message}`);
            this.handleError(evt)
        }
        messaging.peerSocket.onmessage = evt => {
            console.log('App -> messaging -> onmessage from companion: ' + JSON.stringify(evt.data));
            this.handleOnMessageReceived(evt);
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
        this.handleOnMessageReceived = callback;
        return this;
    }

    onMessageSent(callback) {
        this.handleMessageSent = callback;
        return this;
    }

    // Send data by file-transfer
    sendFile(data, filename = 'ft-from-app') {
        console.log(`App -> File transfer -> ${filename} [enqueueing]`)

        outbox.enqueue(filename, encode(data))
            .then(ft => {
                console.log(`App -> File transfer -> ${ft.name} [${ft.readyState}]`);
                ft.onchange = evt => {
                    console.log(`App -> File transfer -> ${ft.name} [${ft.readyState}]`)
                }
            })
            .catch(error => {
                console.log(`App -> File transfer -> Error: Failed to queue ${filename}: ${error}`);
            })
    }

    // Send data by socket
    sendMessage(data = { cmd: '', payload: {} }) {
        console.log(`App -> messaging -> send [${this.socketState()}]`)

        try {
            messaging.peerSocket.send(data);
            this.handleMessageSent(data)
        }
        catch (err) {
            console.error(err + ` Socket is ${this.socketState()}`)
        }
    }

    socketState() {
        return socketCodes[messaging.peerSocket.readyState] || '?'
    }
}

export let transfer = new Transfer()