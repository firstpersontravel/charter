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
  getTitle: function(scriptContent, resource) {
    return resource.event ? resource.event.type : 'no event';
  }
};
