const ModulesRegistry = require('../registries/modules');

const SubresourcesRegistry = {};

Object.values(ModulesRegistry).forEach(module => {
  Object.entries(module.resources).forEach(([resourceType, modResource]) => {
    if (modResource.subresource) {
      SubresourcesRegistry[resourceType] = modResource.subresource;
    }
  });
});

module.exports = SubresourcesRegistry;
