const assert = require('assert');
const moment = require('moment');

const send_audio = require('../../../src/modules/messages/audio_send').default;

describe('#send_audio', () => {
  const now = moment.utc();
  const actionContext = {
    scriptContent: { roles: [{ name: 'Ally' }, { name: 'Babbit' }] },
    evalContext: { venue: 'the bar' },
    evaluateAt: now
  };

  it('reply is needed if specified', () => {
    const params = {
      audio: 'hi',
      from_role_name: 'Ally',
      to_role_name: 'Babbit',
      reply_needed: true
    };

    const res = send_audio.getOps(params, actionContext);

    assert.strictEqual(res[0].fields.isReplyNeeded, true);
  });

  it('sends audio message', () => {
    const params = {
      audio: 'url',
      from_role_name: 'Ally',
      to_role_name: 'Babbit'
    };

    const res = send_audio.getOps(params, actionContext);

    assert.deepEqual(res, [{
      operation: 'createMessage',
      fields: {
        fromRoleName: 'Ally',
        toRoleName: 'Babbit',
        createdAt: now,
        medium: 'audio',
        content: 'url',
        isReplyNeeded: false
      },
      suppressRelayId: null
    }, {
      operation: 'event',
      event: {
        type: 'audio_received',
        from: 'Ally',
        to: 'Babbit',
        url: 'url'
      }
    }]);
  });
});
