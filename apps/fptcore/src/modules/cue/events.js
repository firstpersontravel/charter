var _ = require('lodash');

module.exports = {
  cue_signaled: {
    help: { summary: 'Occurs when a cue has been signaled.' },
    parentResourceParam: 'cue',
    specParams: {
      cue: {
        required: true,
        type: 'reference',
        collection: 'cues',
        display: { primary: true }
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
  }
};
