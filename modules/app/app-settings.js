import * as fs from 'fs';
import { defaults } from '../../common/default-settings';

const filename = 'settings.json';

class AppSettings {
    writeToFilesystem(settings = {}) {
        console.log(`AppSettings -> writeToFilesystem: ${JSON.stringify(settings)}`)
        fs.writeFileSync(filename, settings, 'cbor');
    }

    readFromFilesystem() {
        try {
            return fs.readFileSync(filename, 'cbor');
        }
        catch (e) {
            return null;
        }
    }

    readFromFilesystemOrDefaults() {
        const settings = this.readFromFilesystem();
        if (settings) {
            console.log(`AppSettings -> readFromFilesystemOrDefaults: settings exist on filesystem ${JSON.stringify(settings)}`)
            return settings;
        }
        else {
            console.log(`AppSettings -> readFromFilesystemOrDefaults: get default settings`)
            return defaults;
        }
    }
}

export let appSettings = new AppSettings()