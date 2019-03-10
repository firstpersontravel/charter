var moduleSubresourceSets = [
  require('../modules/pages/subresources'),
  require('../modules/calls/subresources')
];

var SubresourcesRegistry = {};

moduleSubresourceSets.forEach(function(moduleSubresourceSet) {
  for (var resourceType in moduleSubresourceSet) {
    SubresourcesRegistry[resourceType] = moduleSubresourceSet[resourceType];
  }
});

module.exports = SubresourcesRegistry;

// var ModulesRegistry = require('../registries/modules');

// var SubresourcesRegistry = {};

// Object.values(ModulesRegistry).forEach(function(module) {
//   Object.keys(module.subresources).forEach(function(resourceType) {
//     SubresourcesRegistry[resourceType] = module.subresources[resourceType];
//   });
// });

// module.exports = SubresourcesRegistry;
