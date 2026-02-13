const Registry = require('./registry/registry').default;
const components = require('./registry/components').default;

const modules = [
  require('./modules/audio/module').default,
  require('./modules/calls/module').default,
  require('./modules/cues/module').default,
  require('./modules/email/module').default,
  require('./modules/locations/module').default,
  require('./modules/messages/module').default,
  require('./modules/pages/module').default,
  require('./modules/relays/module').default,
  require('./modules/roles/module').default,
  require('./modules/scenes/module').default,
  require('./modules/time/module').default,
  require('./modules/triggers/module').default,
  require('./modules/values/module').default,
  require('./modules/variants/module').default,
];

export default new Registry(modules, components);
