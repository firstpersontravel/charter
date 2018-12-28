var moduleSubresourceSets = [
  require('../modules/panel/subresources'),
  require('../modules/query/subresources')
];

var SubresourcesRegistry = {};

moduleSubresourceSets.forEach(function(moduleSubresourceSet) {
  for (var resourceType in moduleSubresourceSet) {
    SubresourcesRegistry[resourceType] = moduleSubresourceSet[resourceType];
  }
});

module.exports = SubresourcesRegistry;
