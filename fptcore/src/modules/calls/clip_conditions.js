const TemplateUtil = require('../../utils/template');

module.exports = {
  clip_answer_is: {
    properties: {
      response: { type: 'string', required: true, display: { label: false } }
    },
    eval: function(params, evalContext) {
      const msg = TemplateUtil.lookupRef(evalContext, 'event.response');
      return (
        typeof msg === 'string' &&
        msg.toLowerCase().indexOf(params.response.toLowerCase()) > -1
      );
    }
  }
};
