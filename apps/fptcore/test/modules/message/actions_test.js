const assert = require('assert');
const moment = require('moment');

const messageActions = require('../../../src/modules/message/actions');

describe('#custom_message', () => {
  const now = moment.utc();
  const script = {
    content: {
      roles: [{ name: 'Ally' }, { name: 'Babbit' }]
    }
  };
  const context = {
    Ally: { id: 1 },
    Babbit: { id: 2 }
  };

  it('sends text message with content', () => {
    const params = {
      message_type: 'text',
      message_content: 'hi',
      from_role_name: 'Ally',
      to_role_name: 'Babbit'
    };
    const res = messageActions.custom_message.applyAction(
      script, context, params, now);
    assert.deepEqual(res, [{
      operation: 'createMessage',
      fields: {
        sentById: 1,
        sentToId: 2,
        createdAt: now,
        messageType: 'text',
        messageContent: 'hi',
        sentFromLatitude: null,
        sentFromLongitude: null,
        sentFromAccuracy: null,
        isReplyNeeded: false,
        isInGallery: false
      },
      suppressRelayId: null
    }]);
  });

  it('reply is needed for non-actor to actor', () => {
    const scriptWithActor = {
      content: {
        roles: [
          { name: 'Ally', actor: false },
          { name: 'Babbit', actor: true }
        ]
      }
    };
    const params = {
      message_type: 'text',
      message_content: 'hi',
      from_role_name: 'Ally',
      to_role_name: 'Babbit'
    };
    const res = messageActions.custom_message.applyAction(
      scriptWithActor, context, params, now);
    assert.strictEqual(res[0].fields.isReplyNeeded, true);
  });

  it('sends image message with location', () => {
    const params = {
      message_type: 'image',
      message_content: 'url',
      from_role_name: 'Ally',
      to_role_name: 'Babbit',
      location_latitude: 38.051112,
      location_longitude: -122.693563,
      location_accuracy: 30
    };
    const res = messageActions.custom_message.applyAction(
      script, context, params, now);
    assert.deepEqual(res, [{
      operation: 'createMessage',
      fields: {
        sentById: 1,
        sentToId: 2,
        createdAt: now,
        messageType: 'image',
        messageContent: 'url',
        sentFromLatitude: 38.051112,
        sentFromLongitude: -122.693563,
        sentFromAccuracy: 30,
        isReplyNeeded: false,
        isInGallery: true
      },
      suppressRelayId: null
    }]);
  });

  it('sends audio message', () => {
    const params = {
      message_type: 'audio',
      message_content: 'url',
      from_role_name: 'Ally',
      to_role_name: 'Babbit'
    };
    const res = messageActions.custom_message.applyAction(
      script, context, params, now);
    assert.deepEqual(res, [{
      operation: 'createMessage',
      fields: {
        sentById: 1,
        sentToId: 2,
        createdAt: now,
        messageType: 'audio',
        messageContent: 'url',
        sentFromLatitude: null,
        sentFromLongitude: null,
        sentFromAccuracy: null,
        isReplyNeeded: false,
        isInGallery: false
      },
      suppressRelayId: null
    }]);
  });

  it('generates an event', () => {
    const params = {
      message_type: 'audio',
      message_content: 'url',
      from_role_name: 'Ally',
      to_role_name: 'Babbit',
      location_latitude: 38.051112,
      location_longitude: -122.693563,
      location_accuracy: 30
    };
    const event = messageActions.custom_message.eventForParams(params);
    assert.deepStrictEqual(event, {
      type: 'message_sent',
      message: {
        from: 'Ally',
        to: 'Babbit',
        type: 'audio',
        content: 'url'
      },
      location: {
        latitude: 38.051112,
        longitude: -122.693563,
        accuracy: 30
      }
    });
  });
});

describe('#send_message', () => {
  const now = moment.utc();
  const context = {
    Ally: { id: 1, audio_path: 'hi.mp3' },
    Babbit: { id: 2 }
  };

  it('sends text message with content', () => {
    const script = {
      content: {
        messages: [{
          name: 'MESSAGE-HELLO',
          type: 'text',
          from: 'Ally',
          to: 'Babbit',
          content: 'hello'
        }]
      }
    };
    const params = { message_name: 'MESSAGE-HELLO' };
    const res = messageActions.send_message.applyAction(
      script, context, params, now);
    assert.deepStrictEqual(res, [{
      operation: 'createMessage',
      fields: {
        sentById: 1,
        sentToId: 2,
        createdAt: now,
        readAt: null,
        messageName: 'MESSAGE-HELLO',
        messageType: 'text',
        messageContent: 'hello'
      }
    }]);
  });

  it('sends audio message with templated content', () => {
    const script = {
      content: {
        messages: [{
          name: 'MESSAGE-HELLO',
          type: 'audio',
          from: 'Ally',
          to: 'Babbit',
          content: '{{Ally.audio_path}}'
        }]
      }
    };
    const params = { message_name: 'MESSAGE-HELLO' };
    const res = messageActions.send_message.applyAction(
      script, context, params, now);
    assert.deepStrictEqual(res, [{
      operation: 'createMessage',
      fields: {
        sentById: 1,
        sentToId: 2,
        createdAt: now,
        readAt: null,
        messageName: 'MESSAGE-HELLO',
        messageType: 'audio',
        messageContent: 'hi.mp3'
      }
    }]);
  });
});
