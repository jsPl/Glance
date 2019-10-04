import { HeartRateSensor } from 'heart-rate';
import { BodyPresenceSensor } from 'body-presence';
import { display } from 'display';

const sensors = [];

class Sensor {
    sensor = null;
    constructor(SensorType) {
        if (SensorType) {
            this.sensor = new SensorType();
            sensors.push(this.sensor);
        }
    }

    onReading(callback) {
        if (this.sensor) {
            this.sensor.addEventListener('reading', () => {
                //console.log(`${this.sensor} reading`)
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

display.addEventListener('change', () => {
    //console.log('Sensors -> Display is ' + (display.on ? 'on' : 'off'))
    display.on ? sensors.map(sensor => sensor.start()) : sensors.map(sensor => sensor.stop());
})

export let heartRateSensor = new Sensor(HeartRateSensor);
export let bodyPresenceSensor = new Sensor(BodyPresenceSensor);