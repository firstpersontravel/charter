const _ = require('lodash');

module.exports = {
  help: 'Occurs when a player responds to a clip over the phone.',
  specParams: {
    clip: {
      required: true,
      type: 'reference',
      collection: 'clips',
      hint: 'The clip being responded to.'
    },
    allow_partial: {
      type: 'boolean',
      hint: 'Allow partial responses.'
    }
  },
  parentParamNameOnEventSpec: 'clip',
  matchEvent: function(spec, event, actionContext) {
    if (event.partial && !spec.allow_partial) {
      return false;
    }
    return spec.clip === event.clip;
  },
  getTitle: function(scriptContent, spec) {
    if (spec.clip) {
      var clip = _.find(scriptContent.clips, { name: spec.clip });
      return `${clip.title} answered`;
    }
    return 'clip answered';
  }
};
