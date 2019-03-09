var moduleActionSets = [
  require('../modules/audio/actions'),
  require('../modules/call/actions'),
  require('../modules/clip/actions'),
  require('../modules/cue/actions'),
  require('../modules/email/actions'),
  require('../modules/message/actions'),
  require('../modules/page/actions'),
  require('../modules/scene/actions'),
  require('../modules/state/actions'),
  require('../modules/value/actions')
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
