var moduleResourceSets = [
  require('../modules/achievements/resources'),
  require('../modules/audio/resources'),
  require('../modules/checkpoints/resources'),
  require('../modules/calls/resources'),
  require('../modules/email/resources'),
  require('../modules/locations/resources'),
  require('../modules/messages/resources'),
  require('../modules/pages/resources'),
  require('../modules/relays/resources'),
  require('../modules/roles/resources'),
  require('../modules/scenes/resources'),
  require('../modules/triggers/resources'),
  require('../modules/variants/resources')
];

var ResourcesRegistry = {};

moduleResourceSets.forEach(function(moduleResourceSet) {
  for (var resourceType in moduleResourceSet) {
    ResourcesRegistry[resourceType] = moduleResourceSet[resourceType];
  }
});

module.exports = ResourcesRegistry;

// var ModulesRegistry = require('../registries/modules');

// var ResourcesRegistry = {};

// Object.values(ModulesRegistry).forEach(function(module) {
//   Object.keys(module.resources).forEach(function(resourceType) {
//     ResourcesRegistry[resourceType] = module.resources[resourceType];
//   });
// });

// module.exports = ResourcesRegistry;
