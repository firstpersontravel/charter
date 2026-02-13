var ROUTE_VIA_OPTIONS = ['driving', 'walking', 'cycling'];

export default {
  icon: 'compass',
  help: 'A path between one waypoint and another, including walking/driving directions. If one of the waypoints has multiple options, then multiple paths will be fetched.',
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    from: {
      type: 'reference',
      collection: 'waypoints',
      required: true,
      help: 'The starting waypoint.'
    },
    to: {
      type: 'reference',
      collection: 'waypoints',
      required: true,
      help: 'The ending waypoint'
    },
    mode: {
      title: 'Method',
      type: 'enum',
      options: ROUTE_VIA_OPTIONS,
      default: 'driving',
      help: 'The method of transit for directions.'
    },
    via: {
      title: 'Waypoints',
      type: 'list',
      items: {
        type: 'coords',
        help: 'A coord that the route must pass through.'
      },
      help: 'An optional list of coordinates through through which the route must pass.'
    }
  }
};

