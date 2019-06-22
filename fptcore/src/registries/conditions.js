const ModulesRegistry = require('../registries/modules');

const ConditionsRegistry = {};

Object.values(ModulesRegistry).forEach(module => {
  Object.assign(ConditionsRegistry, module.conditions);
});

module.exports = ConditionsRegistry;
