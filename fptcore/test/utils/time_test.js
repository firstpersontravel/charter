const assert = require('assert');
const sinon = require('sinon');
const moment = require('moment-timezone');

const TimeUtil = require('../../src/utils/time');

const sandbox = sinon.sandbox.create();

describe('TimeUtil', () => {

  afterEach(() => {
    sandbox.restore();
  });

  describe('#convertTimeShorthandToIso', () => {
    it('converts time shorthand', () => {
      assert.equal(TimeUtil.convertTimeShorthandToIso('1:34pm', '2017-03-23',
        'US/Pacific'),
      '2017-03-23T20:34:00.000Z');
      assert.equal(TimeUtil.convertTimeShorthandToIso('1:34pm', '2017-03-23',
        'US/Eastern'),
      '2017-03-23T17:34:00.000Z');
    });

    it('converts time shorthand with extra days', () => {
      assert.equal(TimeUtil.convertTimeShorthandToIso(
        '+1d 1:34pm', '2017-03-23', 'US/Pacific'),
      '2017-03-24T20:34:00.000Z');
      assert.equal(TimeUtil.convertTimeShorthandToIso(
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
        arg === undefined ? now : origUtc(arg)
      ));

      const sameTimeAsNow = '2017-03-23T20:34:00.000Z';
      assert.equal(TimeUtil.humanizeIso(sameTimeAsNow, tz), '1:34pm');
      const inAnHour = '2017-03-23T21:34:00.000Z';
      assert.equal(TimeUtil.humanizeIso(inAnHour, tz), '2:34pm');
      const twoHoursAgo = '2017-03-23T18:34:00.000Z';
      assert.equal(TimeUtil.humanizeIso(twoHoursAgo, tz), '11:34am');
    });

    it('displays time and day if different day', () => {
      const origUtc = moment.utc;
      const now = moment.utc('2017-03-23T20:34:00.000Z');
      const tz = 'US/Pacific';
      sandbox.stub(moment, 'utc').callsFake(arg => (
        arg === undefined ? now : origUtc(arg)
      ));

      // Show day if we're yesterday in local time
      const twelveHoursAgo = '2017-03-23T08:34:00.000Z';
      assert.equal(TimeUtil.humanizeIso(twelveHoursAgo, tz), '1:34am');
      const fourteenHoursAgo = '2017-03-23T06:34:00.000Z';
      assert.equal(TimeUtil.humanizeIso(fourteenHoursAgo, tz), 'Wed, 11:34pm');

      // Show day if we're tomorrow in local time
      const inTenHours = '2017-03-24T06:34:00.000Z';
      assert.equal(TimeUtil.humanizeIso(inTenHours, tz), '11:34pm');
      const inThirteenHours = '2017-03-24T09:34:00.000Z';
      assert.equal(TimeUtil.humanizeIso(inThirteenHours, tz), 'Fri, 2:34am');
    });
  });

  describe('#validateTimeShorthand', () => {
    it('should validate correct time shorthands', () => {
      assert.strictEqual(TimeUtil.validateTimeShorthand('1:34pm'), true);
      assert.strictEqual(TimeUtil.validateTimeShorthand('12:34pm'), true);
      assert.strictEqual(TimeUtil.validateTimeShorthand('8:00am'), true);
    });

    it('should fail incorrect time shorthands', () => {
      assert.strictEqual(TimeUtil.validateTimeShorthand('1:3pm'), false);
      assert.strictEqual(TimeUtil.validateTimeShorthand('12:34'), false);
      assert.strictEqual(TimeUtil.validateTimeShorthand('15:00'), false);
    });

    it('should validate correct time shorthands with date', () => {
      assert.strictEqual(TimeUtil.validateTimeShorthand('+1d 1:34pm'), true);
      assert.strictEqual(TimeUtil.validateTimeShorthand('+0d 12:34pm'), true);
      assert.strictEqual(TimeUtil.validateTimeShorthand('+2d 8:00am'), true);
    });

    it('should fail incorrect time shorthands', () => {
      assert.strictEqual(TimeUtil.validateTimeShorthand('+1 1:34pm'), false);
      assert.strictEqual(TimeUtil.validateTimeShorthand('2d 12:34pm'), false);
      assert.strictEqual(TimeUtil.validateTimeShorthand('+2d  8:00am'), false);
    });
  });

  describe('#secondsForDurationShorthand', () => {
    it('should parse seconds', () => {
      assert.strictEqual(TimeUtil.secondsForDurationShorthand('1s'), 1);
      assert.strictEqual(TimeUtil.secondsForDurationShorthand('1.5s'), 1.5);
      assert.strictEqual(TimeUtil.secondsForDurationShorthand('84s'), 84);
      assert.strictEqual(TimeUtil.secondsForDurationShorthand('197.0s'), 197);
      assert.strictEqual(TimeUtil.secondsForDurationShorthand('0s'), 0);
    });

    it('should parse minutes', () => {
      assert.strictEqual(TimeUtil.secondsForDurationShorthand('1m'), 60);
      assert.strictEqual(TimeUtil.secondsForDurationShorthand('8m'), 480);
      assert.strictEqual(TimeUtil.secondsForDurationShorthand('8.25m'), 495);
      assert.strictEqual(TimeUtil.secondsForDurationShorthand('0m'), 0);
    });

    it('should parse negative values as zero', () => {
      assert.strictEqual(TimeUtil.secondsForDurationShorthand('-197s'), 0);
      assert.strictEqual(TimeUtil.secondsForDurationShorthand('-1.5m'), 0);
    });

    it('should parse invalid values as zero', () => {
      assert.strictEqual(TimeUtil.secondsForDurationShorthand(null), 0);
      assert.strictEqual(TimeUtil.secondsForDurationShorthand(''), 0);
      assert.strictEqual(TimeUtil.secondsForDurationShorthand('0'), 0);
      assert.strictEqual(TimeUtil.secondsForDurationShorthand('gabe'), 0);
      assert.strictEqual(TimeUtil.secondsForDurationShorthand('1ss'), 0);
    });
  });

  describe('#secondsForOffsetShorthand', () => {
    it('should parse positive and negative values', () => {
      assert.strictEqual(TimeUtil.secondsForOffsetShorthand('1s'), 1);
      assert.strictEqual(TimeUtil.secondsForOffsetShorthand('-1.5s'), -1.5);
      assert.strictEqual(TimeUtil.secondsForOffsetShorthand('8m'), 480);
      assert.strictEqual(TimeUtil.secondsForOffsetShorthand('-97.0s'), -97);
      assert.strictEqual(TimeUtil.secondsForOffsetShorthand('0s'), 0);
    });

    it('should parse invalid values as zero', () => {
      assert.strictEqual(TimeUtil.secondsForOffsetShorthand(null), 0);
      assert.strictEqual(TimeUtil.secondsForOffsetShorthand(''), 0);
      assert.strictEqual(TimeUtil.secondsForOffsetShorthand('0'), 0);
      assert.strictEqual(TimeUtil.secondsForOffsetShorthand('10x'), 0);
      assert.strictEqual(TimeUtil.secondsForOffsetShorthand('-gabe'), -0);
      assert.strictEqual(TimeUtil.secondsForOffsetShorthand('-1ss'), -0);
    });
  });
});
