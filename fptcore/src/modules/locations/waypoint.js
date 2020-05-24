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
  title: 'Place',
  help: 'A place used by the trip. Each place can have multiple locations that can be set for each trip. For instance, a "lunch" place can have two locations, each a different restaurant.',
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    options: {
      title: 'locations',
      type: 'list',
      default: defaultWaypointOptionList,
      items: waypointOptionSpec,
      help: 'A list of locations that this place could refer to.'
    }
  },
  validateResource: function(script, resource) {
    if (!resource.options || !resource.options.length) {
      return ['A place must have at least one option.'];
    }
  }
};
