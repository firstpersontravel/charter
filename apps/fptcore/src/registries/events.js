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

// var ModulesRegistry = require('../registries/modules');

// var EventsRegistry = {};

// Object.values(ModulesRegistry).forEach(function(module) {
//   Object.keys(module.events).forEach(function(eventType) {
//     EventsRegistry[eventType] = module.events[eventType];
//   });
// });

// module.exports = EventsRegistry;
