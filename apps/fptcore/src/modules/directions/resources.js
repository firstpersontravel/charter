var directions = {
  properties: {
    name: { type: 'name', required: true },
    route: { type: 'reference', collection: 'routes', required: true },
    from_option: { type: 'name', required: true },
    to_option: { type: 'name', required: true },
    polyline: { type: 'string', required: true },
    steps: {
      type: 'list',
      required: true,
      items: {
        type: 'object',
        properties: {
          start: { type: 'coords' },
          instructions: { type: 'string' },
          distance: { type: 'string' }
        }
      }
    }
  }
};

module.exports = {
  directions: directions
};
