const assert = require('assert');

const triggerResources = require('../../../src/modules/trigger/resources');

describe('#validateResource', () => {
  it('warns on actions that lack a required triggering event', () => {
    const script = {};
    const trigger = {
      events: [{ type: 'message_sent', from: 'Role' }],
      actions: [{ name: 'play_clip', params: { clip_name: 'CLIP-NAME' } }]
    };

    const res = triggerResources.trigger.validateResource(script, trigger);

    assert.deepStrictEqual(res, [
      'Action "actions[0]" ("play_clip") is triggered by event "message_sent", but requires one of: call_received, call_answered, query_responded.'
    ]);
  });
});
