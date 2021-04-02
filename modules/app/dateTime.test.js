import DateTime from './dateTime'

const dt = new DateTime();

test('getTimeSenseLastSGV', () => {
    console.log(dt.getTimeSenseLastSGV(1616263775804))

    expect(new Date('2021-03-20T18:09:35.804Z').getTime()).toBe(1616263775804);
});