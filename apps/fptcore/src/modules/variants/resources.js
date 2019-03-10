var departure = {
  help: {
    summary: 'A departure is a label used to differentiate trips taking place simultaneously.'
  },
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true }
  }
};

var variant = {
  help: {
    summary: 'A variant defines a variation in trip values.'
  },
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
      keys: { type: 'reference', collection: 'times' },
      values: { type: 'timeShorthand' }
    },
    starting_pages: {
      type: 'dictionary',
      keys: { type: 'reference', collection: 'roles' },
      values: { type: 'reference', collection: 'pages' }
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

var time = {
  help: {
    summary: 'A time is a configurable schedule that can be defined by variants.'
  },
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true }
  }
};

module.exports = {
  departure: departure,
  time: time,
  variant: variant
};
