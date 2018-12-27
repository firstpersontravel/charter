module.exports = {
  // Audio
  pause_audio: require('./audio/pause_audio'),
  play_audio: require('./audio/play_audio'),
  resume_audio: require('./audio/resume_audio'),
  stop_audio: require('./audio/stop_audio'),
  // Call
  initiate_call: require('./call/initiate_call'),
  add_to_call: require('./call/add_to_call'),
  // Clip
  play_clip: require('./clip/play_clip'),
  // Message
  custom_message: require('./message/custom_message'),
  send_message: require('./message/send_message'),

  signal_cue: require('./signal_cue'),
  increment_value: require('./increment_value'),
  send_to_page: require('./send_to_page'),
  set_state: require('./set_state'),
  set_value: require('./set_value'),
  start_scene: require('./start_scene')
};
