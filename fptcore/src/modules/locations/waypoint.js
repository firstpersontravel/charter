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
    title: { type: 'string', required: true },
    coords: { type: 'coords', required: true },
    address: { type: 'string' },
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
      items: waypointOptionSpec
    }
  }
};
