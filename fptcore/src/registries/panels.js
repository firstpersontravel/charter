const ModulesRegistry = require('../registries/modules');

const PanelsRegistry = {};

Object.values(ModulesRegistry).forEach(module => {
  Object.assign(PanelsRegistry, module.panels);
});

module.exports = PanelsRegistry;
