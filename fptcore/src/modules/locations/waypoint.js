function defaultWaypointOptionName() {
  return 'waypt-opt-' + Math.floor(Math.random() * 100000);
}

function defaultWaypointOptionList() {
  return [{
    name: defaultWaypointOptionName()
  }];
}

var waypointOptionSpec = {
  type: 'object',
  properties: {
    name: {
      type: 'name',
      required: true,
      display: { hidden: true },
      default: defaultWaypointOptionName
    },
    address: {
      type: 'address',
      required: true,
      help: 'The address of the location.'
    },
    coords: {
      type: 'coords',
      required: true,
      display: { hidden: true },
      help: 'The coordinates of the location.'
    },
    title: { type: 'string' },
    values: {
      type: 'dictionary',
      keys: { type: 'simpleAttribute' },
      values: { type: 'simpleValue' }
    }
  }
};

module.exports = {
  icon: 'map-pin',
  help: 'A location used by the trip. Each waypoint can have multiple options that can be set for each trip. For instance, a "lunch" waypoint can have two options, each a different restaurant.',
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    options: {
      type: 'list',
      default: defaultWaypointOptionList,
      items: waypointOptionSpec,
      help: 'A list of locations that this waypoint could refer to.'
    }
  },
  validateResource: function(script, resource) {
    if (!resource.options || !resource.options.length) {
      return ['A waypoint must have at least one option.'];
    }
  }
};
