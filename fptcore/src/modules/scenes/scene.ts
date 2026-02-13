export default {
  icon: scene => (scene && scene.global) ? 'globe' : 'puzzle-piece',
  help: 'A temporal unit of experience. Usually only one scene is active at a time.',
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    global: {
      type: 'boolean',
      title: 'Always active',
      default: false,
      help: 'Enable if this scene is always active. Otherwise, the triggers in this scene will only fire if it is the current scene of the trip.'
    }
  }
};

