module.exports = {
  // Audio
  pause_audio: require('../modules/audio/actions').pause_audio,
  play_audio: require('../modules/audio/actions').play_audio,
  resume_audio: require('../modules/audio/actions').resume_audio,
  stop_audio: require('../modules/audio/actions').stop_audio,
  // Call
  initiate_call: require('../modules/call/actions').initiate_call,
  add_to_call: require('../modules/call/actions').add_to_call,
  // Clip
  play_clip: require('../modules/clip/actions').play_clip,
  // Cue
  signal_cue: require('../modules/cue/actions').signal_cue,
  // Message
  custom_message: require('./message/custom_message'),
  send_message: require('./message/send_message'),
  // Page
  send_to_page: require('./page/send_to_page'),
  // Scene
  start_scene: require('./scene/start_scene'),
  // State
  set_state: require('./state/set_state'),
  // Value
  increment_value: require('./value/increment_value'),
  set_value: require('./value/set_value')
};
