var newModuleNames = [
  'achievements',
  'audio',
  'calls',
];

var oldModuleNames = [
  'checkpoints',
  'email',
  'locations',
  'messages',
  'pages',
  'relays',
  'roles',
  'scenes',
  'triggers',
  'values',
  'variants'
];

var ModulesRegistry = {};

function importOrBlank(moduleName, subtype) {
  try {
    return require('../modules/' + moduleName + '/' + subtype);
  } catch (err) {
    return {};
  }
}

newModuleNames.forEach(function(modName) {
  ModulesRegistry[modName] = require('../modules/' + modName + '/module');
});

oldModuleNames.forEach(function(modName) {
  ModulesRegistry[modName] = {
    subresources: importOrBlank(modName, 'subresources'),
    resources: importOrBlank(modName, 'resources'),
    actions: importOrBlank(modName, 'actions'),
    events: importOrBlank(modName, 'events')
  };
});

module.exports = ModulesRegistry;
