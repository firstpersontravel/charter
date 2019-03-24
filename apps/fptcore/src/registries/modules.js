var newModuleNames = [
  'achievements',
  'audio',
  'calls',
  'cues',
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

var allActions = {};
var allEvents = {};

newModuleNames.forEach(function(modName) {
  var mod = require('../modules/' + modName + '/module');
  mod.actions = {};
  mod.events = {};
  Object.keys(mod.resources).forEach(function(resourceType) {
    var resourceDef = mod.resources[resourceType];
    Object.assign(mod.actions, resourceDef.actions);
    Object.assign(mod.events, resourceDef.events);
  });
  ModulesRegistry[modName] = mod;
  Object.assign(allActions, mod.actions);
  Object.assign(allEvents, mod.events);
});

oldModuleNames.forEach(function(modName) {
  var actions = importOrBlank(modName, 'actions');
  var events = importOrBlank(modName, 'events');
  ModulesRegistry[modName] = {
    subresources: importOrBlank(modName, 'subresources'),
    resources: importOrBlank(modName, 'resources'),
    actions: actions,
    events: events
  };
  Object.assign(allActions, actions);
  Object.assign(allEvents, events);
});


var createTriggerResource = require('./trigger');

ModulesRegistry.trigger = {
  resources: {
    trigger: { resource: createTriggerResource(allActions, allEvents) }
  }
};

module.exports = ModulesRegistry;
