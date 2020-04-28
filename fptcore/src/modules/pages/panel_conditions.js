const _ = require('lodash');

module.exports = {
  submission_contains: {
    properties: {
      part: { type: 'string', required: true, display: { label: false } }
    },
    eval: (params, actionContext) => {
      const msg = _.get(actionContext.evalContext, 'event.submission');
      return (
        typeof msg === 'string' &&
        msg.toLowerCase().indexOf(params.part.toLowerCase()) > -1
      );
    }
  }
};
