var ModulesRegistry = require('../registries/modules');

var EventsRegistry = {};

Object.values(ModulesRegistry).forEach(function(module) {
  Object.assign(EventsRegistry, module.events);
});

module.exports = EventsRegistry;
