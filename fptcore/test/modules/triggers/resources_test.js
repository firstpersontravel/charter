const assert = require('assert');

// Must import from registry since trigger is added after all other events
// and actions are imported.
const ResourcesRegistry = require('../../../src/registries/resources');

describe('#validateResource', () => {
  it('warns on actions that lack a required triggering event', () => {
    const script = {};
    const trigger = {
      events: [{ type: 'message_sent', from: 'Role' }],
      actions: [{ name: 'play_clip', params: { clip_name: 'CLIP-NAME' } }]
    };

    const res = ResourcesRegistry.trigger.validateResource(script, trigger);

    assert.deepStrictEqual(res, [
      'Action "actions[0]" ("play_clip") is triggered by event "message_sent", but requires one of: call_received, call_answered, query_responded.'
    ]);
  });
});
