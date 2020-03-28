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
import fs from "fs";

class AppTransfer extends Transfer {
    constructor() {
        super('App');
        inbox.addEventListener('newfile', this.processIncomingFiles);
    }

    // Send data by file transfer
    sendFile(data, filename = 'ft-from-app') {
        super.sendFile(data, filename)
    }

    processIncomingFiles = () => {
        let fileName;
        try {
            while (fileName = inbox.nextFile()) {
                const data = fs.readFileSync(fileName, 'cbor');
                this.handleFileDataReceived(data);
            }
        }
        catch (error) {
            console.error(`App -> File transfer -> Error: Failed to process ` +
                `incoming file ${fileName}: ${error}`);
        }
    }
}

export let transfer = new AppTransfer()