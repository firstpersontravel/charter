const _ = require('lodash');
const assert = require('assert');
const sinon = require('sinon');
const moment = require('moment-timezone');

const TimeCore = require('../../src/cores/time');

const sandbox = sinon.sandbox.create();

describe('TimeCore', () => {

  afterEach(() => {
    sandbox.restore();
  });

  describe('#convertTimeShorthandToIso', () => {
    it('converts time shorthand', () => {
      assert.equal(TimeCore.convertTimeShorthandToIso('1:34pm', '2017-03-23',
        'US/Pacific'),
      '2017-03-23T20:34:00.000Z');
      assert.equal(TimeCore.convertTimeShorthandToIso('1:34pm', '2017-03-23',
        'US/Eastern'),
      '2017-03-23T17:34:00.000Z');
    });

    it('converts time shorthand with extra days', () => {
      assert.equal(TimeCore.convertTimeShorthandToIso(
        '+1d 1:34pm', '2017-03-23', 'US/Pacific'),
      '2017-03-24T20:34:00.000Z');
      assert.equal(TimeCore.convertTimeShorthandToIso(
        '+2d 1:34pm', '2017-03-23', 'US/Eastern'),
      '2017-03-25T17:34:00.000Z');
    });
  });

  describe('#humanizeIso', () => {
    it('displays time only if same day', () => {
      const origUtc = moment.utc;
      const now = moment.utc('2017-03-23T20:34:00.000Z');
      const tz = 'US/Pacific';
      sandbox.stub(moment, 'utc').callsFake(arg => (
        _.isUndefined(arg) ? now : origUtc(arg)
      ));

      const sameTimeAsNow = '2017-03-23T20:34:00.000Z';
      assert.equal(TimeCore.humanizeIso(sameTimeAsNow, tz), '1:34pm');
      const inAnHour = '2017-03-23T21:34:00.000Z';
      assert.equal(TimeCore.humanizeIso(inAnHour, tz), '2:34pm');
      const twoHoursAgo = '2017-03-23T18:34:00.000Z';
      assert.equal(TimeCore.humanizeIso(twoHoursAgo, tz), '11:34am');
    });

    it('displays time and day if different day', () => {
      const origUtc = moment.utc;
      const now = moment.utc('2017-03-23T20:34:00.000Z');
      const tz = 'US/Pacific';
      sandbox.stub(moment, 'utc').callsFake(arg => (
        _.isUndefined(arg) ? now : origUtc(arg)
      ));

      // Show day if we're yesterday in local time
      const twelveHoursAgo = '2017-03-23T08:34:00.000Z';
      assert.equal(TimeCore.humanizeIso(twelveHoursAgo, tz), '1:34am');
      const fourteenHoursAgo = '2017-03-23T06:34:00.000Z';
      assert.equal(TimeCore.humanizeIso(fourteenHoursAgo, tz), 'Wed, 11:34pm');

      // Show day if we're tomorrow in local time
      const inTenHours = '2017-03-24T06:34:00.000Z';
      assert.equal(TimeCore.humanizeIso(inTenHours, tz), '11:34pm');
      const inThirteenHours = '2017-03-24T09:34:00.000Z';
      assert.equal(TimeCore.humanizeIso(inThirteenHours, tz), 'Fri, 2:34am');
    });
  });

  describe('#validateTimeShorthand', () => {
    it('should validate correct time shorthands', () => {
      assert.strictEqual(TimeCore.validateTimeShorthand('1:34pm'), true);
      assert.strictEqual(TimeCore.validateTimeShorthand('12:34pm'), true);
      assert.strictEqual(TimeCore.validateTimeShorthand('8:00am'), true);
    });

    it('should fail incorrect time shorthands', () => {
      assert.strictEqual(TimeCore.validateTimeShorthand('1:3pm'), false);
      assert.strictEqual(TimeCore.validateTimeShorthand('12:34'), false);
      assert.strictEqual(TimeCore.validateTimeShorthand('15:00'), false);
    });

    it('should validate correct time shorthands with date', () => {
      assert.strictEqual(TimeCore.validateTimeShorthand('+1d 1:34pm'), true);
      assert.strictEqual(TimeCore.validateTimeShorthand('+0d 12:34pm'), true);
      assert.strictEqual(TimeCore.validateTimeShorthand('+2d 8:00am'), true);
    });

    it('should fail incorrect time shorthands', () => {
      assert.strictEqual(TimeCore.validateTimeShorthand('+1 1:34pm'), false);
      assert.strictEqual(TimeCore.validateTimeShorthand('2d 12:34pm'), false);
      assert.strictEqual(TimeCore.validateTimeShorthand('+2d  8:00am'), false);
    });
  });

  describe('#secondsForDurationShorthand', () => {
    it('should parse seconds', () => {
      assert.strictEqual(TimeCore.secondsForDurationShorthand('1s'), 1);
      assert.strictEqual(TimeCore.secondsForDurationShorthand('1.5s'), 1.5);
      assert.strictEqual(TimeCore.secondsForDurationShorthand('84s'), 84);
      assert.strictEqual(TimeCore.secondsForDurationShorthand('197.0s'), 197);
      assert.strictEqual(TimeCore.secondsForDurationShorthand('0s'), 0);
    });

    it('should parse minutes', () => {
      assert.strictEqual(TimeCore.secondsForDurationShorthand('1m'), 60);
      assert.strictEqual(TimeCore.secondsForDurationShorthand('8m'), 480);
      assert.strictEqual(TimeCore.secondsForDurationShorthand('8.25m'), 495);
      assert.strictEqual(TimeCore.secondsForDurationShorthand('0m'), 0);
    });

    it('should parse negative values as zero', () => {
      assert.strictEqual(TimeCore.secondsForDurationShorthand('-197s'), 0);
      assert.strictEqual(TimeCore.secondsForDurationShorthand('-1.5m'), 0);
    });

    it('should parse invalid values as zero', () => {
      assert.strictEqual(TimeCore.secondsForDurationShorthand(null), 0);
      assert.strictEqual(TimeCore.secondsForDurationShorthand(''), 0);
      assert.strictEqual(TimeCore.secondsForDurationShorthand('0'), 0);
      assert.strictEqual(TimeCore.secondsForDurationShorthand('gabe'), 0);
      assert.strictEqual(TimeCore.secondsForDurationShorthand('1ss'), 0);
    });
  });
});
