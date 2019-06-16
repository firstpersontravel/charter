module.exports = {
  name: 'audio',
  resources: {
    audio: {
      resource: null,
      actions: {
        play_audio: require('./audio_play'),
        pause_audio: require('./audio_pause'),
        resume_audio: require('./audio_resume'),
        stop_audio: require('./audio_stop')
      }
    }
  }
};
