const assert = require('assert');
const moment = require('moment');

const custom_message = require('../../../src/modules/messages/message_custom');

describe('#custom_message', () => {
  const now = moment.utc();
  const actionContext = {
    scriptContent: { roles: [{ name: 'Ally' }, { name: 'Babbit' }] },
    evalContext: { venue: 'the bar' },
    evaluateAt: now
  };

  it('sends text message with content', () => {
    const params = {
      medium: 'text',
      content: 'hi',
      from_role_name: 'Ally',
      to_role_name: 'Babbit'
    };

    const res = custom_message.applyAction(params, actionContext);

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
        type: 'message_received',
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

    const res = custom_message.applyAction(params, actionContext);

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

    const res = custom_message.applyAction(params, actionContextWithActor);

    assert.strictEqual(res[0].fields.isReplyNeeded, true);
  });

  it('sends image message with location', () => {
    const params = {
      medium: 'image',
      content: 'url',
      from_role_name: 'Ally',
      to_role_name: 'Babbit',
      latitude: 38.051112,
      longitude: -122.693563,
      accuracy: 30
    };

    const res = custom_message.applyAction(params, actionContext);

    assert.deepEqual(res, [{
      operation: 'createMessage',
      fields: {
        sentByRoleName: 'Ally',
        sentToRoleName: 'Babbit',
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
        type: 'message_received',
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

  it('sends audio message', () => {
    const params = {
      medium: 'audio',
      content: 'url',
      from_role_name: 'Ally',
      to_role_name: 'Babbit'
    };

    const res = custom_message.applyAction(params, actionContext);

    assert.deepEqual(res, [{
      operation: 'createMessage',
      fields: {
        sentByRoleName: 'Ally',
        sentToRoleName: 'Babbit',
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
        type: 'message_received',
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
