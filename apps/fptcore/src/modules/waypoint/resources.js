var waypoint = {
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    options: {
      type: 'list',
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
