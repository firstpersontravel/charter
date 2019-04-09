module.exports = {
  help: 'Occurs when a player receives a call.',
  specParams: {
    from: { required: true, type: 'reference', collection: 'roles' },
    to: { required: true, type: 'reference', collection: 'roles' }
  },
  matchEvent: function(spec, event, actionContext) {
    return spec.from === event.from && spec.to === event.to;
  }
};
