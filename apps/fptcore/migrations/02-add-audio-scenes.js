var _ = require('lodash');

module.exports = function(scriptContent) {
  // Add title and name to audio items.
  _.each(scriptContent.audio, function(audioItem) {
    audioItem.title = audioItem.name;
    audioItem.scene = scriptContent.scenes[0].name;
  });
  // Add title and name to clip items.
  _.each(scriptContent.clips, function(clip) {
    clip.title = clip.name;
    clip.scene = scriptContent.scenes[0].name;
  });
  // Rename `default_layout` to `layout`.
  _.each(scriptContent.roles, function(role) {
    if (role.default_layout) {
      role.layout = role.default_layout;
      delete role.default_layout;
    }
  });
  // Changing `set_state` action to `adjust_page` in a SUPER HACKY WAY
  var js = JSON.stringify(scriptContent);
  if (js.indexOf('set_state') > -1) {
    js = js.replace(/set_state/g, 'adjust_page');
    _.assign(scriptContent, JSON.parse(js));
  }
};
