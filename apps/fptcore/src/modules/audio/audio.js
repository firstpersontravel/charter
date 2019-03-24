module.exports = {
  help: {
    summary: 'An audio clip is a sound that can be referred to and played on different devices.'
  },
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    scene: { type: 'reference', collection: 'scenes', required: true },
    duration: { type: 'number', required: true },
    path: { type: 'media', required: true, medium: 'audio' }
  }
};
