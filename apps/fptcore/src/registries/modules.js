var moduleNames = [
  'achievements',
  'audio',
  'calls',
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

moduleNames.forEach(function(moduleName) {
  ModulesRegistry[moduleName] = {
    subresources: importOrBlank(moduleName, 'subresources'),
    resources: importOrBlank(moduleName, 'resources'),
    actions: importOrBlank(moduleName, 'actions'),
    events: importOrBlank(moduleName, 'events')
  };
});

module.exports = ModulesRegistry;
