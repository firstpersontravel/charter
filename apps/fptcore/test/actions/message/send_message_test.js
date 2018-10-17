const assert = require('assert');
const moment = require('moment');

const sendMessage = require('../../../src/actions/message/send_message');

describe('#sendMessage', () => {

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
    const res = sendMessage(script, context, params, now);
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
          from: 'Ally',
          to: 'Babbit',
          content: '{{Ally.audio_path}}'
        }]
      }
    };
    const params = { message_name: 'MESSAGE-HELLO' };
    const res = sendMessage(script, context, params, now);
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
