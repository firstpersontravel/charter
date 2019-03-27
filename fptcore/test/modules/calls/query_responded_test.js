const assert = require('assert');

const query_responded = require('../../../src/modules/calls/query_responded');

describe('#query_responded', () => {
  it('fires on matching response', () => {
    const spec = { query: 'CLIP-INTRO' };
    const event = {
      type: 'query_responded',
      query: 'CLIP-INTRO',
      partial: false
    };
    const actionContext = {};

    const res = query_responded.matchEvent(spec, event, actionContext);

    assert.strictEqual(res, true);
  });

  it('does not fire on unmatched response', () => {
    const spec = { query: 'CLIP-INTRO' };
    const event = {
      type: 'query_responded',
      query: 'CLIP-OUTRO',
      partial: false
    };
    const actionContext = {};

    const res = query_responded.matchEvent(spec, event, actionContext);
    
    assert.strictEqual(res, false);
  });

  it('does not fire on partial if waiting for final', () => {
    const spec = { query: 'CLIP-INTRO', final: true };
    const event = {
      type: 'query_responded',
      query: 'CLIP-INTRO',
      partial: true
    };
    const actionContext = {};

    const res = query_responded.matchEvent(spec, event, actionContext);

    assert.strictEqual(res, false);
  });

  it('does not fire on final if specifies partial', () => {
    const spec = { query: 'CLIP-INTRO', partial: true };
    const event = {
      type: 'query_responded',
      query: 'CLIP-INTRO',
      partial: false
    };
    const actionContext = {};

    const res = query_responded.matchEvent(spec, event, actionContext);

    assert.strictEqual(res, false);
  });
});
