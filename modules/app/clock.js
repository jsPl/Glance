import clock from 'clock';

export default class Clock {
    constructor(handleOnTick, granularity = 'minutes') {
        clock.granularity = granularity;
        clock.ontick = handleOnTick;
    }
}