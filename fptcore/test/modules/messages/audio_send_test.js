const assert = require('assert');
const moment = require('moment');

const send_audio = require('../../../src/modules/messages/audio_send');

describe('#send_audio', () => {
  const now = moment.utc();
  const actionContext = {
    scriptContent: { roles: [{ name: 'Ally' }, { name: 'Babbit' }] },
    evalContext: { venue: 'the bar' },
    evaluateAt: now
  };

  it('sends audio message', () => {
    const params = {
      content: 'url',
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
        sentFromLatitude: null,
        sentFromLongitude: null,
        sentFromAccuracy: null,
        isReplyNeeded: false,
        isInGallery: false
      },
      suppressRelayId: null
    }, {
      operation: 'event',
      event: {
        type: 'audio_received',
        message: {
          from: 'Ally',
          to: 'Babbit',
          medium: 'audio',
          content: 'url'
        },
        location: {
          latitude: undefined,
          longitude: undefined,
          accuracy: undefined
        }
      }
    }]);
  });
});
