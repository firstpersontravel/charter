var moduleEventSets = [
  require('../modules/call/events'),
  require('../modules/cue/events'),
  require('../modules/geofence/events'),
  require('../modules/message/events'),
  require('../modules/query/events'),
  require('../modules/time/events'),
  require('../modules/scene/events')
];

var EventsRegistry = {};

moduleEventSets.forEach(function(moduleEventSet) {
  for (var eventType in moduleEventSet) {
    EventsRegistry[eventType] = moduleEventSet[eventType];
  }
});

module.exports = EventsRegistry;
