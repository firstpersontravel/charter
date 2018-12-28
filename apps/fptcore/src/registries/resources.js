var moduleResourceSets = [
  require('../modules/audio/resources'),
  require('../modules/appearance/resources'),
  require('../modules/checkpoint/resources'),
  require('../modules/clip/resources'),
  require('../modules/content_pages/resources')
];

var ResourcesRegistry = {};

moduleResourceSets.forEach(function(moduleResourceSet) {
  for (var resourceType in moduleResourceSet) {
    ResourcesRegistry[resourceType] = moduleResourceSet[resourceType];
  }
});

module.exports = ResourcesRegistry;
