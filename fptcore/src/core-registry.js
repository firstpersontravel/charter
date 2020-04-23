const Registry = require('./registry/registry');
const components = require('./registry/components');
const modules = [
  require('./modules/achievements/module'),
  require('./modules/audio/module'),
  require('./modules/calls/module'),
  require('./modules/checkpoints/module'),
  require('./modules/cues/module'),
  require('./modules/email/module'),
  require('./modules/locations/module'),
  require('./modules/messages/module'),
  require('./modules/pages/module'),
  require('./modules/qr/module'),
  require('./modules/relays/module'),
  require('./modules/roles/module'),
  require('./modules/scenes/module'),
  require('./modules/time/module'),
  require('./modules/triggers/module'),
  require('./modules/values/module'),
  require('./modules/variants/module'),
];

module.exports = new Registry(modules, components);
