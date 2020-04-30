module.exports = {
  icon: 'space-shuttle',
  help: 'A variation in trip values, including timing, values, and waypoint options.',
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    default: { type: 'boolean', default: false },
    section: { type: 'string' },
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
      keys: {
        type: 'reference',
        collection: 'times'
      },
      values: {
        type: 'timeShorthand',
        help: 'A time, e.g. 3:00pm, 5:30am, +1d 4:15pm, +2d 12:00pm'
      }
    }
  },
  validateResource: function(script, resource) {
    if (resource.default && resource.section) {
      return ['Default variants cannot have a section.'];
    }
    if (!resource.default && !resource.section) {
      return ['Non-default variants must have a section.'];
    }
  }
};
