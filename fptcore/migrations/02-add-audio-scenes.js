module.exports = {
  migrations: {
    // Add title and name to audio items.
    audio: function(audioItem, scriptContent) {
      audioItem.title = audioItem.name;
      audioItem.scene = scriptContent.scenes[0].name;
    },
    // Add title and name to clip items.
    clips: function(clip, scriptContent) {
      clip.title = clip.name;
      clip.scene = scriptContent.scenes[0].name;
    },
    // Rename `default_layout` to `layout`.
    roles: function(role, scriptContent) {
      if (role.default_layout) {
        role.layout = role.default_layout;
        delete role.default_layout;
      }
    },
    // Changing `set_state` action to `adjust_page` in a SUPER HACKY WAY
    actions: function(action, scriptContent) {
      if (action.name === 'set_state') {
        action.name = 'adjust_page';
      }
    }
  },
  tests: [{
    before: {
      scenes: [{
        name: 'FIRST-SCENE'
      }],
      audio: [{
        name: 'AUDIO-1'
      }],
      clips: [{
        name: 'CLIP-1'
      }],
      roles: [{
        name: 'role',
        default_layout: 'layout'
      }],
      triggers: [{
        actions: [{
          name: 'conditional',
          if: 'true',
          actions: [{ name: 'set_state' }]
        }]
      }]
    },
    after: {
      scenes: [{
        name: 'FIRST-SCENE'
      }],
      audio: [{
        name: 'AUDIO-1',
        title: 'AUDIO-1',
        scene: 'FIRST-SCENE'
      }],
      clips: [{
        name: 'CLIP-1',
        title: 'CLIP-1',
        scene: 'FIRST-SCENE'
      }],
      roles: [{
        name: 'role',
        layout: 'layout'
      }],
      triggers: [{
        actions: [{
          name: 'conditional',
          if: 'true',
          actions: [{ name: 'adjust_page' }]
        }]
      }]
    }
  }]
};
