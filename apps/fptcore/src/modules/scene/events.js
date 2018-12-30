module.exports = {
  scene_started: {
    specParams: {
      self: { required: true, type: 'reference', collection: 'scenes' }
    },
    matchEvent: function(spec, event, actionContext) {
      return spec === event.scene;
    }
  }
};
