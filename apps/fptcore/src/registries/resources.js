var moduleResourceSets = [
  require('../modules/achievement/resources'),
  require('../modules/appearance/resources'),
  require('../modules/audio/resources'),
  require('../modules/checkpoint/resources'),
  require('../modules/clip/resources'),
  require('../modules/content_pages/resources'),
  require('../modules/cue/resources'),
  require('../modules/departure/resources'),
  require('../modules/geofence/resources')
];

var ResourcesRegistry = {};

moduleResourceSets.forEach(function(moduleResourceSet) {
  for (var resourceType in moduleResourceSet) {
    ResourcesRegistry[resourceType] = moduleResourceSet[resourceType];
  }
});

module.exports = ResourcesRegistry;
