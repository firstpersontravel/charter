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
      schedule: {
        time134p: '2017-03-23T20:34:00.000Z',
        time734a: '2017-03-25T10:34:00.000Z',
        future: '2017-10-25T10:34:00.000Z'
      }
    },
    evaluateAt: now
  };
  var time134p = moment.utc(actionContext.evalContext.schedule.time134p);

  describe('#scheduleAtForWhen', () => {
    it('returns now when no modifier', () => {
      var res = ActionPhraseCore.scheduleAtForWhen(null, null, actionContext);
      assertOffset(res, now, 0);
    });

    it('parses action with relative time modifier', () => {
      var res = ActionPhraseCore.scheduleAtForWhen(null, '3m', actionContext);
      assertOffset(res, now, 180);
    });

    it('parses action with absolute time modifier', () => {
      var res = ActionPhraseCore.scheduleAtForWhen('time134p', null,
        actionContext);
      assertOffset(res, time134p, 0);
    });

    it('parses action with complex time modifier', () => {
      var res = ActionPhraseCore.scheduleAtForWhen('time134p', '10m', 
        actionContext);
      assertOffset(res, time134p, 600);

      var res2 = ActionPhraseCore.scheduleAtForWhen('time134p', '-10s',
        actionContext);
      assertOffset(res2, time134p, -10);
    });
  });

  describe('#unpackAction', () => {
    it('unpacks an action object', () => {
      var packed = { name: 'x', param1: 'y', offset: '10m' };
      var res = ActionPhraseCore.unpackAction(packed, actionContext);
      assert.deepStrictEqual(res, {
        name: 'x',
        params: { param1: 'y' },
        scheduleAt: now.clone().add(10, 'minutes')
      });
    });
  });
});
