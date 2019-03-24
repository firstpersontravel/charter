var moduleEventSets = [
  require('../modules/calls/module').resources.call.events,
  require('../modules/calls/module').resources.query.events,
  require('../modules/locations/events'),
  require('../modules/messages/events'),
  require('../modules/triggers/events'),
  require('../modules/scenes/events'),
  require('../modules/variants/events')
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
