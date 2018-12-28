var moduleResourceSets = [
  require('../modules/achievement/resources'),
  require('../modules/appearance/resources'),
  require('../modules/audio/resources'),
  require('../modules/checkpoint/resources'),
  require('../modules/clip/resources'),
  require('../modules/content_page/resources'),
  require('../modules/cue/resources'),
  require('../modules/departure/resources'),
  require('../modules/geofence/resources'),
  require('../modules/layout/resources'),
  require('../modules/message/resources'),
  require('../modules/page/resources'),
  require('../modules/relay/resources'),
  require('../modules/role/resources'),
  require('../modules/route/resources'),
  require('../modules/scene/resources'),
  require('../modules/time/resources'),
  require('../modules/trigger/resources'),
  require('../modules/variant/resources'),
  require('../modules/variant_group/resources'),
  require('../modules/waypoint/resources')
];

var ResourcesRegistry = {};

moduleResourceSets.forEach(function(moduleResourceSet) {
  for (var resourceType in moduleResourceSet) {
    ResourcesRegistry[resourceType] = moduleResourceSet[resourceType];
  }
});

module.exports = ResourcesRegistry;
