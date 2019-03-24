module.exports = {
  help: { summary: 'Occurs when a player answers a call.' },
  specParams: {
    from: { required: true, type: 'reference', collection: 'roles' },
    to: { required: true, type: 'reference', collection: 'roles' }
  },
  matchEvent: function(spec, event, actionContext) {
    return spec.from === event.from && spec.to === event.to;
  }
};
