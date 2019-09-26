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
import { me } from "appbit";
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
            console.log(`App -> messaging -> socket [${socketCodes[evt.code]}]: ${evt.reason} wasClean: ${evt.wasClean}`);
            this.handleClose(evt)
        }
        messaging.peerSocket.onerror = evt => {
            console.log(`App -> messaging -> socket [${socketCodes[evt.code]}]: ${evt.message} [code: ${evt.code}]`);
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

    // Send data
    send(data) {
        console.log(`App -> messaging -> send [${this.socketState()}]`)

        try {
            messaging.peerSocket.send({ cmd: 'forceCompanionTransfer', data });
            this.handleMessageSent()
        }
        catch (err) {
            console.error(err)
            if (isClosed) {
                //console.log('Exiting due to socket CLOSED')
                //me.exit();
            }
        }
    }

    socketState() {
        return socketCodes[messaging.peerSocket.readyState] || '?'
    }
}

export let transfer = new Transfer()