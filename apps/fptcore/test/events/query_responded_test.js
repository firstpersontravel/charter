const assert = require('assert');

const query_responded = require('../../src/events/query_responded');

describe('#query_responded', () => {
  it('fires on matching response', () => {
    const callClause = { query: 'CLIP-INTRO' };
    const event = {
      type: 'query_responded',
      query: 'CLIP-INTRO',
      partial: false
    };
    const res = query_responded.matchEvent({}, {}, callClause, event);
    assert.strictEqual(res, true);
  });

  it('does not fire on unmatched response', () => {
    const callClause = { query: 'CLIP-INTRO' };
    const event = {
      type: 'query_responded',
      query: 'CLIP-OUTRO',
      partial: false
    };
    const res = query_responded.matchEvent({}, {}, callClause, event);
    assert.strictEqual(res, false);
  });

  it('does not fire on partial if waiting for final', () => {
    const callClause = { query: 'CLIP-INTRO', final: true };
    const event = {
      type: 'query_responded',
      query: 'CLIP-INTRO',
      partial: true
    };
    const res = query_responded.matchEvent({}, {}, callClause, event);
    assert.strictEqual(res, false);
  });

  it('does not fire on final if specifies partial', () => {
    const callClause = { query: 'CLIP-INTRO', partial: true };
    const event = {
      type: 'query_responded',
      query: 'CLIP-INTRO',
      partial: false
    };
    const res = query_responded.matchEvent({}, {}, callClause, event);
    assert.strictEqual(res, false);
  });
});
