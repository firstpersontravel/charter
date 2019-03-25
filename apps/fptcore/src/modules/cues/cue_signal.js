var _ = require('lodash');

module.exports = {
  help: { summary: 'Signal a cue.' },
  params: {
    cue_name: {
      required: true,
      type: 'reference',
      collection: 'cues',
      display: { primary: true }
    }
  },
  phraseForm: ['cue_name'],
  applyAction: function(params, actionContext) {
    var cue = _.find(actionContext.scriptContent.cues,
      { name: params.cue_name });
    if (!cue) {
      return [{
        operation: 'log',
        level: 'error',
        message: 'Could not find cue named "' + params.cue_name + '".'
      }];
    }
    return [{
      operation: 'event',
      event: { type: 'cue_signaled', cue: params.cue_name }
    }];
  },
  getChildClaims: function(params) {
    // return ['cues.' + params.cue_name];
  }
};
