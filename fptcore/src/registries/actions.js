const ModulesRegistry = require('../registries/modules');

const ActionsRegistry = {};

Object.values(ModulesRegistry).forEach(module => {
  Object.assign(ActionsRegistry, module.actions);
});

module.exports = ActionsRegistry;
