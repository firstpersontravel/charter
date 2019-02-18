var waypoint = {
  help: {
    summary: 'A waypoint defines a location used by the trip. Each waypoint has multiple options that can be set for each trip.'
  },
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    options: {
      type: 'list',
      default: [{}],
      items: {
        type: 'object',
        properties: {
          name: { type: 'name', required: true },
          title: { type: 'string', required: true },
          coords: { type: 'coords', required: true },
          address: { type: 'string' },
          values: {
            type: 'dictionary',
            keys: { type: 'simpleAttribute' },
            values: { type: 'simpleValue' }
          }
        }
      }
    }
  }
};

module.exports = {
  waypoint: waypoint
};
