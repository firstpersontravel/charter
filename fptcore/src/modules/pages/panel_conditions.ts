import { get } from '../../utils/lodash-replacements';

module.exports = {
  submission_contains: {
    help: 'A condition that passes if the submission contains any part of the \'part\' parameter.',
    properties: {
      part: {
        type: 'string',
        required: true,
        display: { label: false },
        help: 'A text fragment which must be contained by the submission.'
      }
    },
    eval: (params, actionContext) => {
      const msg = get(actionContext.evalContext, 'event.submission');
      return (
        typeof msg === 'string' &&
        msg.toLowerCase().indexOf(params.part.toLowerCase()) > -1
      );
    }
  }
};
