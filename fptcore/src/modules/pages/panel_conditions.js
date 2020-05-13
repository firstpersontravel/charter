const _ = require('lodash');

module.exports = {
  submission_contains: {
    help: 'Condition passes if the submission contains any part of the \'part\' parameter.',
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
