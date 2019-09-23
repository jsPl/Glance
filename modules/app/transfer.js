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

export default class transfer {
    constructor() {
        messaging.peerSocket.onopen = () => {
            console.log('App -> messaging -> socket open');
        }
        messaging.peerSocket.onclose = evt => {
            console.log(`App -> messaging -> socket close: ${evt.reason} [code: ${evt.code}] wasClean: ${evt.wasClean}`);
        }
        messaging.peerSocket.onerror = evt => {
            console.log(`App -> messaging -> socket error: ${evt.message} [code: ${evt.code}]`);
        }
    }

    // Send data
    send(data) {
        const isOpen = messaging.peerSocket.readyState === messaging.peerSocket.OPEN;
        const isClosed = messaging.peerSocket.readyState === messaging.peerSocket.CLOSED;
        const stateText = isOpen ? 'OPEN' : (isClosed ? 'CLOSED' : 'unknown');

        console.log(`App -> messaging -> send [${stateText}]`)

        // if (isOpen) {
        try {
            messaging.peerSocket.send({ command: 'forceCompanionTransfer', data: data });
        }
        catch (err) {
            console.error(err)
            if (isClosed) {
                //console.log('Exiting due to socket CLOSED')
                //me.exit();
            }
        }
        //}
    }
};


// Events

// // Listen for the onopen event
// messaging.peerSocket.onopen = function() {
//   // Fetch weather when the connection opens
//   fetchWeather();
// }

// Listen for messages from the companion
// messaging.peerSocket.onmessage = function(evt) {
//   if (evt.data) {
//   console.log("The temperature is: " + evt.data.temperature);
//   }
// }

// // Listen for the onerror event
// messaging.peerSocket.onerror = function(err) {
//   // Handle any errors
//   console.log("Connection error: " + err.code + " - " + err.message);
// }

