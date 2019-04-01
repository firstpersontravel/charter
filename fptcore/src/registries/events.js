const ModulesRegistry = require('../registries/modules');

const EventsRegistry = {};

Object.values(ModulesRegistry).forEach(module => {
  Object.assign(EventsRegistry, module.events);
});

module.exports = EventsRegistry;
