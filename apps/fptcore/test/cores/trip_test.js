const assert = require('assert');
const moment = require('moment-timezone');

const TripCore = require('../../src/cores/trip');

describe('TripCore', () => {
  describe('#getInitialValues', () => {
    it('creates values from multiple variants', () => {
      const script = {
        content: {
          variants: [
            { name: 'default', values: { abc: '123' } },
            { name: 'opt1', values: { def: '456' } },
            { name: 'opt2', values: { ghi: '789' } }
          ]
        }
      };
      const variantNames = ['opt1'];
      const res = TripCore.getInitialValues(script, variantNames);
      assert.deepEqual(res, {
        abc: 123,
        def: 456
      });
    });
  });

  describe('#getInitialSchedule', () => {
    it('creates a schedule across multiple days', () => {
      const script = {
        content: {
          variants: [
            { name: 'default', schedule: { cue1: '7:00am' } },
            { name: 'part1', schedule: { cue2: '8:00pm' } },
            { name: 'part2', schedule: { cue3: '+1d 9:30am' } }
          ]
        },
        timezone: 'US/Pacific'
      };
      const variantNames = ['part1', 'part2'];
      const res = TripCore.getInitialSchedule(script, '2017-11-01',
        variantNames);
      assert.strictEqual(
        moment.utc(res.cue1).tz('US/Pacific').format('MMM Do YYYY h:mmA z'),
        'Nov 1st 2017 7:00AM PDT');
      assert.strictEqual(
        moment.utc(res.cue2).tz('US/Pacific').format('MMM Do YYYY h:mmA z'),
        'Nov 1st 2017 8:00PM PDT');
      assert.strictEqual(
        moment.utc(res.cue3).tz('US/Pacific').format('MMM Do YYYY h:mmA z'),
        'Nov 2nd 2017 9:30AM PDT');
    });

    it('adapts to daylight savings time change', () => {
      const script = {
        content: {
          variants: [{
            name: 'default',
            schedule: {
              beforeDst: '7:00am',
              afterDst: '+1 7:00am'
            }
          }]
        },
        timezone: 'US/Pacific'
      };
      const res = TripCore.getInitialSchedule(script, '2017-11-04', []);
      assert.strictEqual(
        moment.utc(res.beforeDst).tz('US/Pacific').format('MMM D h:mmA z Z'),
        'Nov 4 7:00AM PDT -07:00');
      assert.strictEqual(
        moment.utc(res.afterDst).tz('US/Pacific').format('MMM D h:mmA z Z'),
        'Nov 5 7:00AM PST -08:00');
    });
  });
});
