const TemplateUtil = require('../../utils/template');

module.exports = {
  clip_answer_is: {
    properties: {
      response: { type: 'string', required: true, display: { label: false } }
    },
    eval: function(params, actionContext) {
      const msg = TemplateUtil.lookupRef(actionContext.evalContext,
        'event.response');
      return (
        typeof msg === 'string' &&
        msg.toLowerCase().indexOf(params.response.toLowerCase()) > -1
      );
    }
  }
};
