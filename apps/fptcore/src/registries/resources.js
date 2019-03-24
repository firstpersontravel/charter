var ModulesRegistry = require('../registries/modules');

var ResourcesRegistry = {};

Object.values(ModulesRegistry).forEach(function(module) {
  Object.keys(module.resources).forEach(function(resourceType) {
    var resourceOrModuleResource = module.resources[resourceType];
    if (resourceOrModuleResource.resource) {
      ResourcesRegistry[resourceType] = resourceOrModuleResource.resource;
    } else if (resourceOrModuleResource.properties) {
      ResourcesRegistry[resourceType] = resourceOrModuleResource;
    }
  });
});

module.exports = ResourcesRegistry;


var ActionsRegistry = require('./actions');
var EventsRegistry = require('./events');
var createTriggerResource = require('./trigger');

ResourcesRegistry.trigger = createTriggerResource(
  ActionsRegistry, EventsRegistry);

module.exports = ResourcesRegistry;
