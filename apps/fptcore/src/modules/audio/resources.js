var audio = {
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string' },
    duration: { type: 'number', required: true },
    path: { type: 'media', required: true, medium: 'audio' }
  }
};

module.exports = {
  audio: audio
};
