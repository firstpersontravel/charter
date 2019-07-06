const _ = require('lodash');

module.exports = {
  text_contains: {
    properties: {
      part: { type: 'string', required: true, display: { label: false } }
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
