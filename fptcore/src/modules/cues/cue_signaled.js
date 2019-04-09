var _ = require('lodash');

module.exports = {
  help: 'Occurs when a cue has been signaled.',
  parentParamNameOnEventSpec: 'cue',
  specParams: {
    cue: {
      required: true,
      type: 'reference',
      collection: 'cues',
      display: { primary: true },
      help: 'The cue that was signaled.'
    }
  },
  matchEvent: function(spec, event, actionContext) {
    return spec.cue === event.cue;
  },
  getTitle: function(scriptContent, spec) {
    var cue = _.find(scriptContent.cues, { name: spec.cue });
    if (!cue) {
      return null;
    }
    return 'cue "' + cue.title + '"';
  }
};
