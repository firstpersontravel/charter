const assert = require('assert');

// Must import from registry since trigger is added after all other events
// and actions are imported.
const Registry = require('../../../src/registry/registry');

describe('#validateResource', () => {
  it('warns on actions that lack a required triggering event', () => {
    const script = {};
    const trigger = {
      event: { type: 'message_received', from: 'Role' },
      actions: [{ name: 'play_clip', params: { clip_name: 'CLIP-NAME' } }]
    };

    const res = Registry.resources.trigger.validateResource(script, trigger);

    assert.deepStrictEqual(res, [
      'Action "actions[0]" ("play_clip") is triggered by event "message_received", but requires one of: call_received, call_answered, clip_answered.'
    ]);
  });
});
