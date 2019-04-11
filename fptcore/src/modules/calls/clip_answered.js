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
  matchEvent: function(spec, event, actionContext) {
    if (event.partial && !spec.allow_partial) {
      return false;
    }
    return spec.clip === event.clip;
  }
};
