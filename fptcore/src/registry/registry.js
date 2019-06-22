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

const componentTypes = ['actions', 'events', 'panels', 'conditions'];
const registry = { modules: {}, resources: {} };
for (const componentType of componentTypes) {
  registry[componentType] = {};
}

// Load modules
for (const mod of modules) {
  for (const componentType of componentTypes) {
    mod[componentType] = {};
  }
  for (const resourceType of Object.keys(mod.resources)) {
    const resourceDef = mod.resources[resourceType];
    for (const componentType of componentTypes) {
      Object.assign(mod[componentType], resourceDef[componentType]);
      Object.assign(registry[componentType], resourceDef[componentType]);
    }
    if (resourceDef.resource) {
      registry.resources[resourceType] = resourceDef.resource;
    }
  }
  registry.modules[mod.name] = mod;
}

// Create trigger module
const createTriggerResource = require('./trigger');
const trigger = createTriggerResource(registry.actions, registry.events);
const triggerModule = { resources: { trigger: { resource: trigger } } };
registry.modules.triggers = triggerModule;
registry.resources.trigger = trigger;

module.exports = registry;
