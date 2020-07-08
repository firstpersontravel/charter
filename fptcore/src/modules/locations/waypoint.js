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
    location: {
      type: 'location',
      display: { label: false },
      required: true,
      help: 'The address of the location.'
    },
    values: {
      display: { hidden: true },
      title: 'Variable defaults',
      help: 'These values are accessible to a run when this location is selected. For instance, if there are directions associated with the various locations for a place, you could set those here.',
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
      title: 'Locations',
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
