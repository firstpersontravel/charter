var assert = require('assert');
var moment = require('moment');

var ActionPhraseCore = require('../src/action_phrase');

function assertOffset(actual, expected, offsetInSeconds) {
  assert.equal(
    actual.format(),
    expected.clone().add(offsetInSeconds, 'seconds').format());
}

describe('ActionPhraseCore', () => {

  var context = {
    time134p: '2017-03-23T20:34:00.000Z',
    time734a: '2017-03-25T10:34:00.000Z',
    future: '2017-10-25T10:34:00.000Z'
  };
  var now = moment.utc('2017-02-01T20:57:22Z');
  var time134p = moment.utc(context.time134p);
  var time734a = moment.utc(context.time734a);

  describe('#timeForShorthand', () => {

    it('parses times relative from now', () => {
      assertOffset(ActionPhraseCore.timeForShorthand('in -60s', now, context),
        now, 0);
      assertOffset(ActionPhraseCore.timeForShorthand('in 0s', now, context),
        now, 0);
      assertOffset(ActionPhraseCore.timeForShorthand('in 0m', now, context),
        now, 0);
      assertOffset(ActionPhraseCore.timeForShorthand('in 5s', now, context),
        now, 5);
      assertOffset(ActionPhraseCore.timeForShorthand('in 90s', now, context),
        now, 90);
      assertOffset(ActionPhraseCore.timeForShorthand('in 1m', now, context),
        now, 60);
      assertOffset(ActionPhraseCore.timeForShorthand('in 1.5m', now, context),
        now, 90);
      assertOffset(ActionPhraseCore.timeForShorthand('in 60m', now, context),
        now, 3600);
      assertOffset(ActionPhraseCore.timeForShorthand('in bad', now, context),
        now, 0);
    });

    it('parses times at a var', () => {
      assertOffset(ActionPhraseCore.timeForShorthand('at time134p', now,
        context), time134p, 0);
      assertOffset(ActionPhraseCore.timeForShorthand('at time734a', now,
        context), time734a, 0);
    });

    it('parses times before a var', () => {
      assertOffset(ActionPhraseCore.timeForShorthand('17.5m before time134p',
        now, context), time134p, -1050);
      assertOffset(ActionPhraseCore.timeForShorthand('60s before time134p',
        now, context), time134p, -60);
      assertOffset(ActionPhraseCore.timeForShorthand('1s before time134p',
        now, context), time134p, -1);
      assertOffset(ActionPhraseCore.timeForShorthand('-10s before time134p',
        now, context), time134p, 0);
    });

    it('parses times after a var', () => {
      assertOffset(ActionPhraseCore.timeForShorthand('17.5m after time734a',
        now, context), time734a, 1050);
      assertOffset(ActionPhraseCore.timeForShorthand('60s after time734a',
        now, context), time734a, 60);
      assertOffset(ActionPhraseCore.timeForShorthand('1s after time734a',
        now, context), time734a, 1);
      assertOffset(ActionPhraseCore.timeForShorthand('-10s after time734a',
        now, context), time734a, 0);
    });
  });

  describe('#extractModifier', () => {
    it('splits and trims modifiers', () => {
      assert.deepEqual(ActionPhraseCore.extractModifier('in 4m, do a thing'),
        ['when', 'in 4m', 'do a thing']);
      assert.deepEqual(ActionPhraseCore.extractModifier(
        ' 4m after time ,do a thing'),
      ['when', '4m after time', 'do a thing']);
    });

    it('handles missing modifier', () => {
      assert.deepEqual(ActionPhraseCore.extractModifier('do a thing'),
        [null, null, 'do a thing']);
    });
  });

  describe('#expandActionPhrase', () => {
    it('parses simple cue', () => {
      var res = ActionPhraseCore.expandActionPhrase('cue cue_name', now, context);
      assert.equal(res.name, 'cue');
      assert.deepEqual(res.params, { cue_name: 'cue_name' });
      assertOffset(res.scheduleAt, now, 0);
    });

    it('parses simple send_to_page', () => {
      var res = ActionPhraseCore.expandActionPhrase(
        'send_to_page Patrick PAGE1', now, context);
      assert.equal(res.name, 'send_to_page');
      assert.deepEqual(res.params,
        { role_name: 'Patrick', page_name: 'PAGE1' });
      assertOffset(res.scheduleAt, now, 0);
    });

    it('parses action with var string', () => {
      var res = ActionPhraseCore.expandActionPhrase(
        'set_state Role "nav window"', now, context);
      assert.equal(res.name, 'set_state');
      assert.deepEqual(res.params,
        { role_name: 'Role', new_value: '"nav window"' });
    });

    it('parses action with relative time modifier', () => {
      var res = ActionPhraseCore.expandActionPhrase(
        'in 3m, cue cue_name', now, context);
      assert.equal(res.name, 'cue');
      assert.deepEqual(res.params, { cue_name: 'cue_name' });
      assertOffset(res.scheduleAt, now, 180);
    });

    it('parses action with absolute time modifier', () => {
      var res = ActionPhraseCore.expandActionPhrase(
        'at time134p, cue cue_name', now, context);
      assert.equal(res.name, 'cue');
      assert.deepEqual(res.params, { cue_name: 'cue_name' });
      assertOffset(res.scheduleAt, time134p, 0);
    });

    it('parses action with complex time modifier', () => {
      var res = ActionPhraseCore.expandActionPhrase(
        '10m AFTER  time134p, cue cue_name', now, context);
      assert.equal(res.name, 'cue');
      assert.deepEqual(res.params, { cue_name: 'cue_name' });
      assertOffset(res.scheduleAt, time134p, 600);

      var res2 = ActionPhraseCore.expandActionPhrase(
        '10s  before time134p , cue cue_name', now, context);
      assert.equal(res2.name, 'cue');
      assert.deepEqual(res2.params, { cue_name: 'cue_name' });
      assertOffset(res2.scheduleAt, time134p, -10);
    });
  });

});
