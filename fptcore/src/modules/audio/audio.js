module.exports = {
  icon: 'music',
  help: 'A sound that can be played on different devices.',
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    scene: { type: 'reference', collection: 'scenes', required: true },
    duration: {
      type: 'number',
      required: true,
      help: 'Duration in seconds of this audio clip. Used for displaying time remaining.'
    },
    path: {
      type: 'media',
      required: true, medium: 'audio',
      help: 'The audio file.'
    }
  }
};
