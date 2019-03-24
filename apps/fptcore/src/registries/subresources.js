var ModulesRegistry = require('../registries/modules');

var SubresourcesRegistry = {};

Object.values(ModulesRegistry).forEach(function(module) {
  Object.keys(module.resources).forEach(function(resourceType) {
    var moduleResource = module.resources[resourceType];
    if (moduleResource.subresource) {
      SubresourcesRegistry[resourceType] = moduleResource.subresource;
    }
  });
  if (module.subresources) {
    Object.keys(module.subresources).forEach(function(resourceType) {
      SubresourcesRegistry[resourceType] = module.subresources[resourceType];
    });
  }
});

module.exports = SubresourcesRegistry;
