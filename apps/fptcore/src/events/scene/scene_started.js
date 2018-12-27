module.exports = {
  specParams: {
    self: { required: true, type: 'resource', collection: 'scenes' }
  },
  matchEvent: function(script, context, spec, event) {
    return spec === event.scene;
  }
};