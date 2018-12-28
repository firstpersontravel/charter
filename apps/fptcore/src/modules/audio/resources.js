var audio = {
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string' },
    duration: { type: 'number', required: true },
    path: { type: 'media', required: true, extensions: ['m4a', 'mp3'] }
  }
};

module.exports = {
  audio: audio
};
