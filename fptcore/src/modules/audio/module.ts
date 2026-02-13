export default {
  name: 'audio',
  resources: {
    audio: {
      resource: null,
      actions: {
        play_audio: require('./audio_play').default,
        pause_audio: require('./audio_pause').default,
        resume_audio: require('./audio_resume').default,
        stop_audio: require('./audio_stop').default
      }
    }
  }
};

