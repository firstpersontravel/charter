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
        Ally: { audio_path: 'hi.mp3' }
      },
      evaluateAt: now
    };

    const res = send_message.applyAction(params, actionContext);

    assert.deepStrictEqual(res, [{
      operation: 'createMessage',
      fields: {
        sentByRoleName: 'Ally',
        sentToRoleName: 'Babbit',
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
        Ally: { audio_path: 'hi.mp3' }
      },
      evaluateAt: now
    };

    const res = send_message.applyAction(params, actionContext);

    assert.deepStrictEqual(res, [{
      operation: 'createMessage',
      fields: {
        sentByRoleName: 'Ally',
        sentToRoleName: 'Babbit',
        createdAt: now,
        readAt: null,
        name: 'MESSAGE-HELLO',
        medium: 'audio',
        content: 'hi.mp3'
      }
    }]);
  });

  describe('#validateResource', () => {
    it.skip('prohibits params.to_role_name with message.to');
    it.skip('needs params.to_role_name when no message.to');
  });
});
