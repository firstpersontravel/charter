var moduleNames = [
  'achievement',
  'appearance',
  'audio',
  'call',
  'checkpoint',
  'clip',
  'content_page',
  'cue',
  'departure',
  'email',
  'geofence',
  'layout',
  'message',
  'page',
  'panel',
  'query',
  'relay',
  'role',
  'route',
  'scene',
  'state',
  'time',
  'trigger',
  'value',
  'variant',
  'waypoint'
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
