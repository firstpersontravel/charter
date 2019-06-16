const assert = require('assert');
const moment = require('moment');

const send_text = require('../../../src/modules/messages/text_send');

describe('#send_text', () => {
  const now = moment.utc();
  const actionContext = {
    scriptContent: { roles: [{ name: 'Ally' }, { name: 'Babbit' }] },
    evalContext: { venue: 'the bar' },
    evaluateAt: now
  };

  it('sends text message with content', () => {
    const params = {
      content: 'hi',
      from_role_name: 'Ally',
      to_role_name: 'Babbit'
    };

    const res = send_text.getOps(params, actionContext);

    assert.deepEqual(res, [{
      operation: 'createMessage',
      fields: {
        sentByRoleName: 'Ally',
        sentToRoleName: 'Babbit',
        createdAt: now,
        medium: 'text',
        content: 'hi',
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
        type: 'text_received',
        message: {
          from: 'Ally',
          to: 'Babbit',
          medium: 'text',
          content: 'hi'
        },
        location: {
          latitude: undefined,
          longitude: undefined,
          accuracy: undefined
        }
      }
    }]);
  });

  it('sends text message with templating', () => {
    const params = {
      medium: 'text',
      content: 'We are meeting at {{venue}}.',
      from_role_name: 'Ally',
      to_role_name: 'Babbit'
    };

    const res = send_text.getOps(params, actionContext);

    assert.strictEqual(res[0].fields.content, 'We are meeting at the bar.');
  });

  it('reply is needed for non-actor to actor', () => {
    const actionContextWithActor = Object.assign({}, actionContext, {
      scriptContent: {
        roles: [
          { name: 'Ally', actor: false },
          { name: 'Babbit', actor: true }
        ]
      }
    });
    const params = {
      medium: 'text',
      content: 'hi',
      from_role_name: 'Ally',
      to_role_name: 'Babbit'
    };

    const res = send_text.getOps(params, actionContextWithActor);

    assert.strictEqual(res[0].fields.isReplyNeeded, true);
  });
});
