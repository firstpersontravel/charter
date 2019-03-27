const assert = require('assert');

const scene_started = require('../../../src/modules/scenes/scene_started');

describe('#scene_started', () => {
  it('fires on matching scene', () => {
    const event = { type: 'scene_started', scene: 'abc' };
    const actionContext = {};

    const res = scene_started.matchEvent({ scene: 'abc' }, event,
      actionContext);

    assert.strictEqual(res, true);
  });

  it('does not fire on unmatched scene', () => {
    const event = { type: 'scene_started', scene: 'def' };
    const actionContext = {};

    const res = scene_started.matchEvent({ scene: 'abc' }, event,
      actionContext);

    assert.strictEqual(res, false);
  });
});
