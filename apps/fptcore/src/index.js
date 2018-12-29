module.exports = {
  ActionsRegistry: require('./registries/actions'),
  ActionCore: require('./cores/action'),
  ActionParamCore: require('./cores/action_param'),
  ActionPhraseCore: require('./cores/action_phrase'),
  ActionResultCore: require('./cores/action_result'),
  ContextCore: require('./cores/context'),
  EvalCore: require('./cores/eval'),
  EventsRegistry: require('./registries/events'),
  PlayerCore: require('./cores/player'),
  SceneCore: require('./cores/scene'),
  ScriptValidationCore: require('./cores/script_validation'),
  TextCore: require('./cores/text'),
  TimeCore: require('./cores/time'),
  TripCore: require('./cores/trip'),
  TriggerCore: require('./cores/trigger'),
  TriggerEventCore: require('./cores/trigger_event'),
  WaypointCore: require('./cores/waypoint')
};
