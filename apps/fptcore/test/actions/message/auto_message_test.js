const assert = require('assert');
const moment = require('moment');

const autoMessage = require('../../../src/actions/message/auto_message');

describe('#autoMessage', () => {

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
          content: 'hello'
        }]
      }
    };
    const params = {
      message_name: 'MESSAGE-HELLO',
      from_role_name: 'Ally',
      to_role_name: 'Babbit'
    };
    const res = autoMessage(script, context, params, now);
    assert.deepStrictEqual(res, [{
      operation: 'createMessage',
      updates: {
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
          content: '{{Ally.audio_path}}'
        }]
      }
    };
    const params = {
      message_name: 'MESSAGE-HELLO',
      from_role_name: 'Ally',
      to_role_name: 'Babbit'
    };
    const res = autoMessage(script, context, params, now);
    assert.deepStrictEqual(res, [{
      operation: 'createMessage',
      updates: {
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
