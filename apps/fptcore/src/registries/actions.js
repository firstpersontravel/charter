var moduleActionSets = [
  require('../modules/audio/actions'),
  require('../modules/calls/actions'),
  require('../modules/email/actions'),
  require('../modules/messages/actions'),
  require('../modules/pages/actions'),
  require('../modules/scenes/actions'),
  require('../modules/triggers/actions'),
  require('../modules/values/actions')
];

var ActionsRegistry = {};

moduleActionSets.forEach(function(moduleActionSet) {
  for (var actionName in moduleActionSet) {
    ActionsRegistry[actionName] = moduleActionSet[actionName];
  }
});

module.exports = ActionsRegistry;

// var ModulesRegistry = require('../registries/modules');

// var ActionsRegistry = {};

// Object.values(ModulesRegistry).forEach(function(module) {
//   Object.keys(module.actions).forEach(function(actionName) {
//     ActionsRegistry[actionName] = module.actions[actionName];
//   });
// });

// module.exports = ActionsRegistry;
