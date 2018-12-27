const assert = require('assert');

const sceneEvents = require('../../../src/modules/scene/events');

describe('#scene_started', () => {
  it('fires on matching scene', () => {
    const event = { type: 'scene_started', scene: 'abc' };
    const res = sceneEvents.scene_started.matchEvent({},{}, 'abc', event);
    assert.strictEqual(res, true);
  });

  it('does not fire on unmatched scene', () => {
    const event = { type: 'scene_started', scene: 'def' };
    const res = sceneEvents.scene_started.matchEvent({}, {}, 'abc', event);
    assert.strictEqual(res, false);
  });
});
