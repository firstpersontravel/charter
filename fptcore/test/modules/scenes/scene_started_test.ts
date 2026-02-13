const assert = require('assert');

const scene_started = require('../../../src/modules/scenes/scene_started').default;

describe('#scene_started', () => {
  it('fires on any scene', () => {
    const event = { type: 'scene_started' };
    const actionContext = {};

    const res = scene_started.matchEvent({ scene: 'abc' }, event,
      actionContext);

    assert.strictEqual(res, true);
  });
});
