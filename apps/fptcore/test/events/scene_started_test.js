const assert = require('assert');

const scene_started = require('../../src/events/scene_started');

describe('#scene_started', () => {
  it('fires on matching scene', () => {
    const event = { type: 'scene_started', scene: 'abc' };
    const res = scene_started.matchEvent({},{}, 'abc', event);
    assert.strictEqual(res, true);
  });

  it('does not fire on unmatched scene', () => {
    const event = { type: 'scene_started', scene: 'def' };
    const res = scene_started.matchEvent({}, {}, 'abc', event);
    assert.strictEqual(res, false);
  });
});
