module.exports = {
  help: { summary: 'Occurs when a scene has been started.' },
  parentResourceParam: 'scene',
  specParams: {
    scene: {
      required: true,
      type: 'reference',
      collection: 'scenes',
      display: { primary: true }
    }
  },
  matchEvent: function(spec, event, actionContext) {
    return spec.scene === event.scene;
  }
};
