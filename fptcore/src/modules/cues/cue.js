module.exports = {
  icon: 'bell',
  help: {
    summary: 'A cue is a signal that can be fired by button presses or other game actions. In and of itself, a cue does nothing, but most commonly it will be used to fire triggers that launch other game actions.'
  },
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    scene: { type: 'reference', collection: 'scenes', required: true }
  }
};
