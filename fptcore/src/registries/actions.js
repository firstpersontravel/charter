var ModulesRegistry = require('../registries/modules');

var ActionsRegistry = {};

Object.values(ModulesRegistry).forEach(function(module) {
  Object.assign(ActionsRegistry, module.actions);
});

module.exports = ActionsRegistry;
