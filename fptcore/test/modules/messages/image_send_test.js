const assert = require('assert');
const moment = require('moment');

const send_image = require('../../../src/modules/messages/image_send');

describe('#send_image', () => {
  const now = moment.utc();
  const actionContext = {
    scriptContent: { roles: [{ name: 'Ally' }, { name: 'Babbit' }] },
    evalContext: { venue: 'the bar' },
    evaluateAt: now
  };

  it('sends image message with location', () => {
    const params = {
      content: 'url',
      from_role_name: 'Ally',
      to_role_name: 'Babbit',
      latitude: 38.051112,
      longitude: -122.693563,
      accuracy: 30
    };

    const res = send_image.getOps(params, actionContext);

    assert.deepEqual(res, [{
      operation: 'createMessage',
      fields: {
        fromRoleName: 'Ally',
        toRoleName: 'Babbit',
        createdAt: now,
        medium: 'image',
        content: 'url',
        sentFromLatitude: 38.051112,
        sentFromLongitude: -122.693563,
        sentFromAccuracy: 30,
        isReplyNeeded: false,
        isInGallery: true
      },
      suppressRelayId: null
    }, {
      operation: 'event',
      event: {
        type: 'image_received',
        message: {
          from: 'Ally',
          to: 'Babbit',
          medium: 'image',
          content: 'url'
        },
        location: {
          latitude: 38.051112,
          longitude: -122.693563,
          accuracy: 30
        }
      }
    }]);
  });
});
