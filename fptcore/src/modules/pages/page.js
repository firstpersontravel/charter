module.exports = {
  icon: 'sticky-note',
  help: 'A user interface that can be displayed to a player when the corresponding scene and state is active.',
  properties: {
    name: { type: 'string', required: true },
    scene: {
      type: 'reference',
      collection: 'scenes',
      required: true,
      parent: true
    },
    role: {
      type: 'reference',
      collection: 'roles',
      required: true,
      parent: true,
      help: 'The role that can view this page.'
    },
    appearance: {
      type: 'reference',
      collection: 'appearances',
      help: 'An optional appearance. Appearances can help keep actor roles organized when they are in multiple trips at the same time.'
    },
    title: {
      type: 'string',
      required: true
    },
    directive: {
      type: 'string',
      help: 'A high-level directive for the player, that will be displayed in large font at the top of the interface.'
    },
    layout: {
      type: 'reference',
      collection: 'layouts',
      allowNull: true,
      display: { hidden: true }
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
  },
  getParentClaims: function(resource) {
    return resource.appearance ?
      ['appearances.' + resource.appearance] :
      ['roles.' + resource.role];
  },
  getChildClaims: function(resource) {
    // return _(resource.panels)
    //   .filter('cue')
    //   .map(function(panel) {
    //     return 'cues.' + panel.cue;
    //   })
    //   .value();
  }
};
