var variant = {
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    variant_group: { type: 'reference', collection: 'variant_groups' },
    default: { type: 'boolean', default: false },
    initial_values: {
      type: 'dictionary',
      keys: { type: 'simpleAttribute' },
      values: { type: 'simpleValue' }
    },
    customizations: {
      type: 'dictionary',
      keys: { type: 'simpleAttribute' },
      values: { type: 'simpleValue' }
    },
    waypoint_options: {
      type: 'dictionary',
      keys: { type: 'reference', collection: 'waypoints' },
      // HMM -- how to refer to embedded subresources?
      values: { type: 'name' }
    },
    schedule: {
      type: 'dictionary',
      keys: { type: 'reference', collection: 'times' },
      values: { type: 'timeShorthand' }
    },
    starting_pages: {
      type: 'dictionary',
      keys: { type: 'reference', collection: 'roles' },
      values: { type: 'reference', collection: 'pages' }
    }
  }
};

module.exports = {
  variant: variant
};
