const assert = require('assert');
const moment = require('moment');

const send_message = require('../../../src/modules/messages/message_send');

describe('#send_message', () => {
  const now = moment.utc();

  it('sends text message with content', () => {
    const params = { message_name: 'MESSAGE-HELLO' };
    const actionContext = {
      scriptContent: {
        messages: [{
          name: 'MESSAGE-HELLO',
          medium: 'text',
          from: 'Ally',
          to: 'Babbit',
          content: 'hello'
        }]
      },
      evalContext: {
        Ally: { id: 1, audio_path: 'hi.mp3' },
        Babbit: { id: 2 }
      },
      evaluateAt: now
    };

    const res = send_message.applyAction(params, actionContext);

    assert.deepStrictEqual(res, [{
      operation: 'createMessage',
      fields: {
        sentById: 1,
        sentToId: 2,
        createdAt: now,
        readAt: null,
        name: 'MESSAGE-HELLO',
        medium: 'text',
        content: 'hello'
      }
    }]);
  });

  it('sends audio message with templated content', () => {
    const params = { message_name: 'MESSAGE-HELLO' };
    const actionContext = {
      scriptContent: {
        messages: [{
          name: 'MESSAGE-HELLO',
          medium: 'audio',
          from: 'Ally',
          to: 'Babbit',
          content: '{{Ally.audio_path}}'
        }]
      },
      evalContext: {
        Ally: { id: 1, audio_path: 'hi.mp3' },
        Babbit: { id: 2 }
      },
      evaluateAt: now
    };

    const res = send_message.applyAction(params, actionContext);

    assert.deepStrictEqual(res, [{
      operation: 'createMessage',
      fields: {
        sentById: 1,
        sentToId: 2,
        createdAt: now,
        readAt: null,
        name: 'MESSAGE-HELLO',
        medium: 'audio',
        content: 'hi.mp3'
      }
    }]);
  });
});
