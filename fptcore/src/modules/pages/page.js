module.exports = {
  icon: 'sticky-note',
  help: 'A user interface that can be displayed to a player when the corresponding scene and state is active.',
  properties: {
    name: { type: 'string', required: true },
    scene: {
      type: 'reference',
      collection: 'scenes',
      required: true,
      parent: true,
      help: 'The scene during which this page is active. If this scene is not the current scene, the page may still be displayed, but no user action may be taken.'
    },
    interface: {
      type: 'reference',
      collection: 'interfaces',
      required: true,
      parent: true,
      help: 'The interface that this page is a part of.'
    },
    title: {
      type: 'string',
      required: true
    },
    directive: {
      type: 'string',
      help: 'A high-level directive for the player, that will be displayed in large font at the top of the interface.',
      display: { multiline: true }
    },
    waypoint: {
      type: 'reference',
      collection: 'waypoints',
      help: 'An optional location for the activity corresponding to this page. This is only visible on the operations page, not to players.'
    },
    route: {
      type: 'reference',
      collection: 'routes',
      help: 'An optional route corresponding to this page. This is only visible on the operations page, not to players.'
    },
    panels: {
      type: 'list',
      items: { type: 'component', component: 'panels' },
      help: 'List of user interface panels.',
    }
  },
  validateResource: function(script, resource) {
    if (resource.route && resource.waypoint) {
      return ['Page resource cannot have both a route and a waypoint.'];
    }
  }
};
