const ModulesRegistry = require('../registries/modules');

const ResourcesRegistry = {};

Object.values(ModulesRegistry).forEach(module => {
  Object.entries(module.resources).forEach(([resourceType, modResource]) => {
    if (modResource.resource) {
      ResourcesRegistry[resourceType] = modResource.resource;
    }
  });
});

module.exports = ResourcesRegistry;

const ActionsRegistry = require('./actions');
const EventsRegistry = require('./events');
const createTriggerResource = require('./trigger');

ResourcesRegistry.trigger = createTriggerResource(ActionsRegistry, 
  EventsRegistry);

module.exports = ResourcesRegistry;
