import { HeartRateSensor } from 'heart-rate';
import { BodyPresenceSensor } from 'body-presence';
import { display } from 'display';

const sensors = [];

class HRSensor {
    constructor() {
        if (HeartRateSensor) {
            const hrm = new HeartRateSensor();
            sensors.push(hrm);
            this.sensor = hrm;
        }
    }

    onReading(callback) {
        if (this.sensor) {
            this.sensor.addEventListener('reading', () => {
                //console.log(`Sensors -> Heart rate reading: ${this.sensor.heartRate}`);
                callback(this.sensor)
            });
        }
        return this
    }

    start() {
        this.sensor && this.sensor.start();
        return this;
    }

    stop() {
        this.sensor && this.sensor.stop();
        return this;
    }
}

class BPSensor {
    constructor() {
        if (BodyPresenceSensor) {
            const bps = new BodyPresenceSensor();
            sensors.push(bps);
            this.sensor = bps;
        }
    }

    onReading(callback) {
        if (this.sensor) {
            this.sensor.addEventListener('reading', () => {
                //console.log(`Sensors -> Body presence reading: ${this.sensor.present}`);
                callback(this.sensor.present)
            });
        }
        return this
    }

    start() {
        this.sensor && this.sensor.start();
        return this;
    }

    stop() {
        this.sensor && this.sensor.stop();
        return this;
    }
}

display.addEventListener('change', () => {
    //console.log('Sensors -> Display is ' + (display.on ? 'on' : 'off'))
    display.on ? sensors.map(sensor => sensor.start()) : sensors.map(sensor => sensor.stop());
})

export let heartRateSensor = new HRSensor();
export let bodyPresenceSensor = new BPSensor();