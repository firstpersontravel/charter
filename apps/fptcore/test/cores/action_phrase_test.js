var assert = require('assert');
var moment = require('moment');

var ActionPhraseCore = require('../../src/cores/action_phrase');

function assertOffset(actual, expected, offsetInSeconds) {
  assert.equal(
    actual.format(),
    expected.clone().add(offsetInSeconds, 'seconds').format());
}

describe('ActionPhraseCore', () => {

  const now = moment.utc('2017-02-01T20:57:22Z');
  var actionContext = {
    evalContext: {
      time134p: '2017-03-23T20:34:00.000Z',
      time734a: '2017-03-25T10:34:00.000Z',
      future: '2017-10-25T10:34:00.000Z'
    },
    evaluateAt: now
  };
  var time134p = moment.utc(actionContext.evalContext.time134p);
  var time734a = moment.utc(actionContext.evalContext.time734a);

  describe('#timeForShorthand', () => {

    it('parses times relative from now', () => {
      assertOffset(ActionPhraseCore.timeForShorthand('in -60s', actionContext),
        now, 0);
      assertOffset(ActionPhraseCore.timeForShorthand('in 0s', actionContext),
        now, 0);
      assertOffset(ActionPhraseCore.timeForShorthand('in 0m', actionContext),
        now, 0);
      assertOffset(ActionPhraseCore.timeForShorthand('in 5s', actionContext),
        now, 5);
      assertOffset(ActionPhraseCore.timeForShorthand('in 90s', actionContext),
        now, 90);
      assertOffset(ActionPhraseCore.timeForShorthand('in 1m', actionContext),
        now, 60);
      assertOffset(ActionPhraseCore.timeForShorthand('in 1.5m', actionContext),
        now, 90);
      assertOffset(ActionPhraseCore.timeForShorthand('in 60m', actionContext),
        now, 3600);
      assertOffset(ActionPhraseCore.timeForShorthand('in bad', actionContext),
        now, 0);
    });

    it('parses times at a var', () => {
      assertOffset(
        ActionPhraseCore.timeForShorthand('at time134p', actionContext), 
        time134p, 0);
      assertOffset(
        ActionPhraseCore.timeForShorthand('at time734a', actionContext), 
        time734a, 0);
    });

    it('parses times before a var', () => {
      assertOffset(
        ActionPhraseCore.timeForShorthand('17.5m before time134p',
          actionContext), time134p, -1050);
      assertOffset(
        ActionPhraseCore.timeForShorthand('60s before time134p',
          actionContext), time134p, -60);
      assertOffset(
        ActionPhraseCore.timeForShorthand('1s before time134p',
          actionContext), time134p, -1);
      assertOffset(
        ActionPhraseCore.timeForShorthand('-10s before time134p',
          actionContext), time134p, 0);
    });

    it('parses times after a var', () => {
      assertOffset(
        ActionPhraseCore.timeForShorthand('17.5m after time734a',
          actionContext), time734a, 1050);
      assertOffset(
        ActionPhraseCore.timeForShorthand('60s after time734a',
          actionContext), time734a, 60);
      assertOffset(
        ActionPhraseCore.timeForShorthand('1s after time734a',
          actionContext), time734a, 1);
      assertOffset(
        ActionPhraseCore.timeForShorthand('-10s after time734a',
          actionContext), time734a, 0);
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

  describe('#parseActionPhrase', () => {
    it('parses simple cue', () => {
      var res = ActionPhraseCore.parseActionPhrase(
        'signal_cue cue_name', actionContext);
      assert.deepStrictEqual(res, {
        name: 'signal_cue',
        cue_name: 'cue_name'
      });
    });

    it('parses simple send_to_page', () => {
      var res = ActionPhraseCore.parseActionPhrase(
        'send_to_page Patrick PAGE1', actionContext);
      assert.deepStrictEqual(res, {
        name: 'send_to_page',
        role_name: 'Patrick',
        page_name: 'PAGE1'
      });
    });

    it('parses action with var string', () => {
      var res = ActionPhraseCore.parseActionPhrase(
        'adjust_page Role "nav window"', actionContext);
      assert.deepStrictEqual(res, {
        name: 'adjust_page',
        role_name: 'Role',
        new_value: '"nav window"'
      });
    });

    it('parses action with relative time modifier', () => {
      var res = ActionPhraseCore.parseActionPhrase(
        'in 3m, signal_cue cue_name', actionContext);
      assert.deepStrictEqual(res, {
        name: 'signal_cue',
        cue_name: 'cue_name',
        when: 'in 3m'
      });
    });

    it('parses action with absolute time modifier', () => {
      var res = ActionPhraseCore.parseActionPhrase(
        'at time134p, signal_cue cue_name', actionContext);
      assert.deepStrictEqual(res, {
        name: 'signal_cue',
        cue_name: 'cue_name',
        when: 'at time134p'
      });
    });

    it('parses action with complex time modifier', () => {
      var res = ActionPhraseCore.parseActionPhrase(
        '10m AFTER  time134p, signal_cue cue_name', actionContext);
      assert.deepStrictEqual(res, {
        name: 'signal_cue',
        cue_name: 'cue_name',
        when: '10m AFTER  time134p'
      });

      var res2 = ActionPhraseCore.parseActionPhrase(
        '10s  before time134p , signal_cue cue_name', actionContext);
      assert.deepStrictEqual(res2, {
        name: 'signal_cue',
        cue_name: 'cue_name',
        when: '10s  before time134p'
      });
    });
  });

  describe('#scheduleAtForWhen', () => {
    it('returns now when no modifier', () => {
      var res = ActionPhraseCore.scheduleAtForWhen(null, actionContext);
      assertOffset(res, now, 0);
    });

    it('parses action with relative time modifier', () => {
      var res = ActionPhraseCore.scheduleAtForWhen('in 3m', actionContext);
      assertOffset(res, now, 180);
    });

    it('parses action with absolute time modifier', () => {
      var res = ActionPhraseCore.scheduleAtForWhen('at time134p',
        actionContext);
      assertOffset(res, time134p, 0);
    });

    it('parses action with complex time modifier', () => {
      var res = ActionPhraseCore.scheduleAtForWhen('10m AFTER  time134p', 
        actionContext);
      assertOffset(res, time134p, 600);

      var res2 = ActionPhraseCore.scheduleAtForWhen('10s  before time134p',
        actionContext);
      assertOffset(res2, time134p, -10);
    });
  });

  describe('#unpackAction', () => {
    it('unpacks an action object', () => {
      var packed = { name: 'x', param1: 'y', when: 'in 10m' };
      var res = ActionPhraseCore.unpackAction(packed, actionContext);
      assert.deepStrictEqual(res, {
        name: 'x',
        params: { param1: 'y' },
        scheduleAt: now.clone().add(10, 'minutes')
      });
    });
  });
});
