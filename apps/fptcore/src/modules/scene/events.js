module.exports = {
  scene_started: {
    parentResourceParam: 'scene',
    specParams: {
      scene: { required: true, type: 'reference', collection: 'scenes' }
    },
    matchEvent: function(spec, event, actionContext) {
      return spec.scene === event.scene;
    }
  }
};
