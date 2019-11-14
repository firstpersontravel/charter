var _ = require('lodash');

module.exports = {
  help: 'Occurs when a cue has been signaled.',
  parentParamNameOnEventSpec: 'cue',
  specParams: {
    cue: {
      required: true,
      type: 'reference',
      collection: 'cues',
      display: { label: false },
      help: 'The cue that was signaled.'
    }
  },
  matchEvent: function(spec, event, actionContext) {
    return spec.cue === event.cue;
  },
  getTitle: function(scriptContent, resource, registry) {
    var cue = _.find(scriptContent.cues, { name: resource.cue });
    return `cue "${cue ? cue.title : 'unknown'}"`;
  }
};
