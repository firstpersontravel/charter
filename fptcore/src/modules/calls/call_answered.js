module.exports = {
  help: 'Occurs when a users answers a call initiated by Charter.',
  specParams: {
    from: {
      required: true,
      type: 'reference',
      collection: 'roles',
      help: 'The player who initiated the call.'
    },
    to: {
      required: true,
      type: 'reference',
      collection: 'roles',
      help: 'The player who answered the call.'
    }
  },
  eventParams: {
    from: {
      required: true,
      type: 'reference',
      collection: 'roles',
      help: 'The player who initiated the call.'
    },
    to: {
      required: true,
      type: 'reference',
      collection: 'roles',
      help: 'The player who answered the call.'
    }
  },
  matchEvent: function(spec, event, actionContext) {
    return spec.from === event.from && spec.to === event.to;
  }
};
