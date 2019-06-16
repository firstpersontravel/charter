const modules = [
  require('../modules/achievements/module'),
  require('../modules/audio/module'),
  require('../modules/calls/module'),
  require('../modules/checkpoints/module'),
  require('../modules/cues/module'),
  require('../modules/email/module'),
  require('../modules/locations/module'),
  require('../modules/messages/module'),
  require('../modules/pages/module'),
  require('../modules/relays/module'),
  require('../modules/roles/module'),
  require('../modules/scenes/module'),
  require('../modules/time/module'),
  require('../modules/values/module'),
  require('../modules/variants/module'),
];

const ModulesRegistry = {};

// Load modules
modules.forEach(function(mod) {
  mod.actions = {};
  mod.events = {};
  Object.keys(mod.resources).forEach(resourceType => {
    const resourceDef = mod.resources[resourceType];
    Object.assign(mod.actions, resourceDef.actions);
    Object.assign(mod.events, resourceDef.events);
  });
  ModulesRegistry[mod.name] = mod;
});

// Gather actions and events
const allActions = {};
const allEvents = {};

Object.values(ModulesRegistry).forEach(module => {
  Object.assign(allActions, module.actions);
  Object.assign(allEvents, module.events);
});

// Create trigger module
const createTriggerResource = require('./trigger');

ModulesRegistry.triggers = {
  resources: {
    trigger: {
      resource: createTriggerResource(allActions, allEvents)
    }
  }
};

module.exports = ModulesRegistry;
