var audio = {
  properties: {
    name: { type: 'name' },
    title: { type: 'string' },
    duration: { type: 'number' },
    path: { type: 'media', extensions: ['m4a', 'mp3'] }
  }
};

module.exports = {
  audio: audio
};
