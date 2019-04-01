var waypointOptionSpec = {
  type: 'object',
  properties: {
    name: {
      type: 'name',
      required: true,
      display: { hidden: true },
      default: function() {
        return 'waypt-opt-' + Math.floor(Math.random() * 100000);
      }
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
  help: {
    summary: 'A waypoint defines a location used by the trip. Each waypoint has multiple options that can be set for each trip.'
  },
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    options: {
      type: 'list',
      default: [{}],
      items: waypointOptionSpec
    }
  }
};
