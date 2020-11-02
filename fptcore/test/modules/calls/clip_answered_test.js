const assert = require('assert');

const clip_answered = require('../../../src/modules/calls/clip_answered');

describe('#clip_answered', () => {
  it('fires on matching response', () => {
    const spec = { clip: 'CLIP-INTRO' };
    const event = {
      type: 'clip_answered',
      clip: 'CLIP-INTRO',
      partial: false
    };
    const actionContext = {};

    const res = clip_answered.matchEvent(spec, event, actionContext);

    assert.strictEqual(res, true);
  });

  it('does not fire on unmatched response', () => {
    const spec = { clip: 'CLIP-INTRO' };
    const event = {
      type: 'clip_answered',
      clip: 'CLIP-OUTRO',
      partial: false
    };
    const actionContext = {};

    const res = clip_answered.matchEvent(spec, event, actionContext);
    
    assert.strictEqual(res, false);
  });

  it('does not fire on partial if waiting for final', () => {
    const spec = { clip: 'CLIP-INTRO', allow_partial: false };
    const event = {
      type: 'clip_answered',
      clip: 'CLIP-INTRO',
      partial: true
    };
    const actionContext = {};

    const res = clip_answered.matchEvent(spec, event, actionContext);

    assert.strictEqual(res, false);
  });

  it('fires on partial if allowed', () => {
    const spec = { clip: 'CLIP-INTRO', allow_partial: true };
    const event = {
      type: 'clip_answered',
      clip: 'CLIP-INTRO',
      partial: true
    };
    const actionContext = {};

    const res = clip_answered.matchEvent(spec, event, actionContext);

    assert.strictEqual(res, true);
  });
});
