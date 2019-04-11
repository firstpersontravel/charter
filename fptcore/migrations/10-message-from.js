const _ = require('lodash');

module.exports = {
  migrations: {
    // Add `to` to all `send_message` actions.
    actions: function(action, scriptContent) {
      if (action.name === 'send_message') {
        const message = _.find(scriptContent.messages, {
          name: action.message_name
        });
        action.to_role_name = (
          action.to_role_name ||
          message.to ||
          message.from
        );
      }
    },
    // And remove `to` from all messages.
    messages: function(message) {
      delete message.to;
    }
  },
  tests: [{
    before: {
      triggers: [{
        actions: [{
          name: 'send_message',
          message_name: 'message'
        }]
      }],
      messages: [{
        name: 'message',
        to: 'role'
      }]
    },
    after: {
      triggers: [{
        actions: [{
          name: 'send_message',
          message_name: 'message',
          to_role_name: 'role'
        }]
      }],
      messages: [{
        name: 'message'
      }]
    }
  }]
};
