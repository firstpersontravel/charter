module.exports = {
  specParams: {
    from: { required: true, type: 'resource', collection: 'roles' },
    to: { required: true, type: 'resource', collection: 'roles' }
  },
  matchEvent: function(script, context, spec, event) {
    return spec.from === event.from && spec.to === event.to;
  }
};
