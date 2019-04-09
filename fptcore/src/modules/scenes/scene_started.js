module.exports = {
  help: 'Occurs when a scene has been started.',
  specParams: {},
  matchEvent: function(spec, event, actionContext) {
    // The scene_started event matches always, since it's filtered by
    // the `scene` parameter of the trigger.
    return true;
  }
};
