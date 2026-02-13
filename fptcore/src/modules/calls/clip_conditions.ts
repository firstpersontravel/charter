const TemplateUtil = require('../../utils/template').default;

export default {
  clip_answer_is: {
    help: 'A condition that passes if the response to the clip being answered contains any part of the \'response\' parameter.',
    properties: {
      response: {
        type: 'string',
        required: true,
        display: { label: false },
        help: 'A simple string to check for within the clip response.'
      }
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

