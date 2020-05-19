const _ = require('lodash');

module.exports = {
  text_contains: {
    help: 'Condition passes if the content to the text contains any part of the \'part\' parameter.',
    properties: {
      part: {
        type: 'string',
        required: true,
        display: { label: false },
        help: 'A fragment of text to look for in the text response.'
      }
    },
    eval: (params, actionContext) => {
      const msg = _.get(actionContext.evalContext, 'event.message.content');
      return (
        typeof msg === 'string' &&
        msg.toLowerCase().indexOf(params.part.toLowerCase()) > -1
      );
    }
  },
  text_is_affirmative: {
    help: 'Condition passes if the content to the text seems affirmitive (contains \'yes\', \'ok\', \'sure\', etc.',
    properties: {},
    eval: (params, actionContext) => {
      const msg = _.get(actionContext.evalContext, 'event.message.content');
      const affirmativeParts = ['y', 'yes', 'sure', 'ok'];
      if (typeof msg !== 'string') {
        return false;
      }
      const lower = msg.toLowerCase();
      return _.some(affirmativeParts, part => lower.indexOf(part) > -1);
    }
  }
};
