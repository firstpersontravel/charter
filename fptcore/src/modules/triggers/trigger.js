const TextUtil = require('../../utils/text');

module.exports = {
  icon: 'certificate',
  help: 'A fires when a defined event occurs. Once fired, it will apply a set of actions, which change the trip state.',
  properties: {
    name: { type: 'name', required: true },
    scene: { type: 'reference', collection: 'scenes', required: true },
    event: { type: 'component', component: 'events' },
    repeatable: { type: 'boolean', default: true },
    active_if: { type: 'component', component: 'conditions' },
    actions: {
      type: 'list',
      items: { type: 'component', component: 'actions' }
    }
  },
  getEventTitle: function(scriptContent, resource, registry) {
    if (!resource.event) {
      return 'no trigger';
    }
    const eventClass = registry.events[resource.event.type];
    return eventClass.getTitle
      ? eventClass.getTitle(scriptContent, resource.event, registry)
      : TextUtil.titleForKey(resource.event.type).toLowerCase();
  },
  getTitle: function(scriptContent, resource, registry) {
    if (!resource.event || !resource.event.type) {
      return 'Untriggerable';
    }
    return `On ${this.getEventTitle(scriptContent, resource, registry)}`;
  }
};
