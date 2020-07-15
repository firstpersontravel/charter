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

  it('reply is needed if specified', () => {
    const params = {
      image: 'hi',
      from_role_name: 'Ally',
      to_role_name: 'Babbit',
      reply_needed: true
    };

    const res = send_image.getOps(params, actionContext);

    assert.strictEqual(res[0].fields.isReplyNeeded, true);
  });

  it('sends image message', () => {
    const params = {
      image: 'url',
      from_role_name: 'Ally',
      to_role_name: 'Babbit'
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
        isReplyNeeded: false,
        isInGallery: true
      },
      suppressRelayId: null
    }, {
      operation: 'event',
      event: {
        type: 'image_received',
        from: 'Ally',
        to: 'Babbit',
        url: 'url'
      }
    }]);
  });
});
