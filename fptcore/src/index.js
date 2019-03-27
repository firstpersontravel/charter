module.exports = {
  ActionsRegistry: require('./registries/actions'),
  ActionCore: require('./cores/action'),
  ActionParamCore: require('./cores/action_param'),
  ActionPhraseCore: require('./cores/action_phrase'),
  ActionResultCore: require('./cores/action_result'),
  ContextCore: require('./cores/context'),
  Errors: require('./errors'),
  EvalCore: require('./cores/eval'),
  EventsRegistry: require('./registries/events'),
  GeofenceCore: require('./cores/geofence'),
  ModulesRegistry: require('./registries/modules'),
  ParamValidators: require('./utils/param_validators'),
  PlayerCore: require('./cores/player'),
  ResourcesRegistry: require('./registries/resources'),
  SceneCore: require('./cores/scene'),
  ScriptCore: require('./cores/script'),
  SubresourcesRegistry: require('./registries/subresources'),
  TextUtil: require('./utils/text'),
  TimeUtil: require('./utils/time'),
  TripCore: require('./cores/trip'),
  TriggerCore: require('./cores/trigger'),
  TriggerEventCore: require('./cores/trigger_event'),
  WaypointCore: require('./cores/waypoint')
};