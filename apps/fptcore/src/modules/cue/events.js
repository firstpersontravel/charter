var _ = require('lodash');

module.exports = {
  cue_signaled: {
    parentResourceParam: 'cue',
    specParams: {
      cue: { required: true, type: 'reference', collection: 'cues' }
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
