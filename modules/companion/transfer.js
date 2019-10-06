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
import Transfer from '../../common/transfer';
import { inbox } from "file-transfer";

class CompanionTransfer extends Transfer {
    constructor() {
        super('Companion')
        inbox.addEventListener('newfile', this.processIncomingFiles);
    }

    // Send data to the watchface
    sendFile(data, filename = 'response2.json') {
        super.sendFile(data, filename)
    }

    async processIncomingFiles() {
        let file;
        try {
            while ((file = await inbox.pop())) {
                const payload = await file.cbor();
                console.log(`Companion -> File transfer -> Inbox: ${JSON.stringify(payload)}`);
            }
        }
        catch (error) {
            console.error(`Companion -> File transfer -> Error: Failed to process ` +
                `incoming file ${file}: ${error}`);
        }
    }
}

export let transfer = new CompanionTransfer()