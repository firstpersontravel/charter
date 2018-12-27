module.exports = {
  // Call
  call_answered: require('../modules/call/events').call_answered,
  call_received: require('../modules/call/events').call_received,
  call_ended: require('../modules/call/events').call_ended,
  // Cue
  cue_signaled: require('../modules/cue/events').cue_signaled,
  // Geofence
  geofence_entered: require('./geofence/geofence_entered'),
  // Message
  message_sent: require('./message/message_sent'),
  // Query
  query_responded: require('./query/query_responded'),
  // Time
  time_occurred: require('./time/time_occurred'),
  // Scene
  scene_started: require('./scene/scene_started')
};
