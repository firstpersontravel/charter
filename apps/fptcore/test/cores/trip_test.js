const assert = require('assert');
const moment = require('moment-timezone');

const TripCore = require('../../src/cores/trip');

describe('TripCore', () => {

  describe('#getInitialFields', () => {
    it('creates customizations from multiple variants', () => {
      const script = {
        content: {
          variants: [{
            name: 'default',
            default: true,
            customizations: { abc: '123' }
          }, {
            name: 'opt1',
            customizations: { def: '456' },
          }, {
            name: 'opt2',
            customizations: { ghi: '789' }
          }]
        }
      };
      const res = TripCore.getInitialFields(script, null, 'US/Pacific',
        ['opt1']);
      assert.deepEqual(res.customizations, {
        abc: 123,
        def: 456,
      });
    });

    it('creates values from multiple variants', () => {
      const script = {
        content: {
          variants: [{
            name: 'default',
            default: true,
            initial_values: { abc: '123' }
          }, {
            name: 'opt1',
            initial_values: { def: '456' },
          }, {
            name: 'opt2',
            initial_values: { ghi: '789' }
          }]
        }
      };
      const res = TripCore.getInitialFields(script, null, 'US/Pacific',
        ['opt1']);
      assert.deepEqual(res.values, {
        abc: 123,
        def: 456
      });
    });

    it('creates waypoint options from multiple variants', () => {
      const script = {
        content: {
          variants: [{
            name: 'default',
            default: true,
            waypoint_options: { w1: 'option4' }
          }, {
            name: 'opt2',
            waypoint_options: { w1: 'option1' }
          }]
        }
      };
      const res = TripCore.getInitialFields(script, null, 'US/Pacific',
        ['opt2']);
      assert.deepEqual(res.waypointOptions, { w1: 'option1' });
    });

    it('creates a schedule across multiple days', () => {
      const script = {
        content: {
          variants: [
            { name: 'default', default: true, schedule: { cue1: '7:00am' } },
            { name: '1', schedule: { cue2: '8:00pm' } },
            { name: '2', schedule: { cue3: '+1d 9:30am' } }
          ]
        }
      };
      const res = TripCore.getInitialFields(script, '2017-11-01', 'US/Pacific', ['1', '2']);
      const sch = res.schedule;
      assert.strictEqual(
        moment.utc(sch.cue1).tz('US/Pacific').format('MMM Do YYYY h:mmA z'),
        'Nov 1st 2017 7:00AM PDT');
      assert.strictEqual(
        moment.utc(sch.cue2).tz('US/Pacific').format('MMM Do YYYY h:mmA z'),
        'Nov 1st 2017 8:00PM PDT');
      assert.strictEqual(
        moment.utc(sch.cue3).tz('US/Pacific').format('MMM Do YYYY h:mmA z'),
        'Nov 2nd 2017 9:30AM PDT');
    });

    it('adapts to daylight savings time change', () => {
      const script = {
        content: {
          variants: [{
            name: 'default',
            default: true,
            schedule: { beforeDst: '7:00am', afterDst: '+1 7:00am' }
          }]
        },
        timezone: 'US/Pacific'
      };
      const res = TripCore.getInitialFields(script, '2017-11-04', 'US/Pacific',[]);
      const sch = res.schedule;
      assert.strictEqual(
        moment.utc(sch.beforeDst).tz('US/Pacific').format('MMM D h:mmA z Z'),
        'Nov 4 7:00AM PDT -07:00');
      assert.strictEqual(
        moment.utc(sch.afterDst).tz('US/Pacific').format('MMM D h:mmA z Z'),
        'Nov 5 7:00AM PST -08:00');
    });
  });
});
