var moduleNames = [
  'achievements',
  'audio',
  'calls',
  'checkpoints',
  'cues',
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

moduleNames.forEach(function(moduleName) {
  var mod = require('../modules/' + moduleName + '/module');
  mod.actions = {};
  mod.events = {};
  Object.keys(mod.resources).forEach(function(resourceType) {
    var resourceDef = mod.resources[resourceType];
    Object.assign(mod.actions, resourceDef.actions);
    Object.assign(mod.events, resourceDef.events);
  });
  ModulesRegistry[moduleName] = mod;
});

var allActions = {};
var allEvents = {};

Object.values(ModulesRegistry).forEach(function(module) {
  Object.assign(allActions, module.actions);
  Object.assign(allEvents, module.events);
});

var createTriggerResource = require('./trigger');

ModulesRegistry.triggers = {
  resources: {
    trigger: { resource: createTriggerResource(allActions, allEvents) }
  }
};

module.exports = ModulesRegistry;
