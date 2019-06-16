const _ = require('lodash');

module.exports = {
  migrations: {
    // Change message_received to <medium>_received
    eventSpecs: function(eventSpec, scriptContent) {
      if (eventSpec.type === 'message_received') {
        eventSpec.type = `${eventSpec.medium || 'text'}_received`;
        delete eventSpec.medium;
      }
    },
    // Change custom_message and send_message to send_<medium>
    actions: function(action, scriptContent) {
      if (action.name === 'custom_message') {
        action.name = `send_${action.medium}`;
        delete action.medium;
      } else if (action.name === 'send_message') {
        const message = _.find(scriptContent.messages, {
          name: action.message_name
        });
        action.name = `send_${message.medium}`;
        action.from_role_name = message.from;
        action.content = message.content;
        delete action.message_name;
      }
    },
    // Change message_contains and message_affirmative to text_*
    ifExpressions: function(ifExpr, scriptContent) {
      if (ifExpr.op === 'message_contains') {
        ifExpr.op = 'text_contains';
      } else if (ifExpr.op === 'message_is_affirmative') {
        ifExpr.op = 'text_is_affirmative';
      }
    },
    // Delete all messages
    scriptContent: function(scriptContent) {
      delete scriptContent.messages;
    }
  },
  tests: [{
    before: {
      messages: [{
        name: 'msg1',
        medium: 'audio',
        from: 'Bob',
        content: 'x'
      }],
      triggers: [{
        events: [{
          type: 'message_received',
          medium: 'text',
          from: 'Gabe'
        }],
        active_if: { op: 'message_is_affirmative' },
        actions: [{
          name: 'send_message',
          message_name: 'msg1',
          to_role_name: 'Ted'
        }, {
          name: 'custom_message',
          medium: 'image',
          content: 'path.jpg'
        }]
      }]
    },
    after: {
      triggers: [{
        events: [{
          type: 'text_received',
          from: 'Gabe'
        }],
        active_if: { op: 'text_is_affirmative' },
        actions: [{
          name: 'send_audio',
          from_role_name: 'Bob',
          to_role_name: 'Ted',
          content: 'x'
        }, {
          name: 'send_image',
          content: 'path.jpg'
        }]
      }]
    }
  }]
};
