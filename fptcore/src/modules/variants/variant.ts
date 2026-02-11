import type { ScriptContent } from '../../types';
module.exports = {
  icon: 'space-shuttle',
  help: 'A variation in trip values, including timing, values, and waypoint options.',
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    default: {
      type: 'boolean',
      default: false,
      help: 'If default is set to true, all new trips will have these defaults set.'
    },
    section: {
      title: 'Variant group',
      help: 'You can group variants if you want to allow only one of a set to be selected. For instance, if you have a basic and deluxe variant, give both variants a group name of "package", and only one can be selected at a time.',
      type: 'string'
    },
    initial_values: {
      title: 'Variable defaults',
      type: 'dictionary',
      keys: { type: 'simpleAttribute' },
      values: { type: 'simpleValue' }
    },
    customizations: {
      title: 'Customization defaults',
      type: 'dictionary',
      keys: { type: 'simpleAttribute' },
      values: { type: 'simpleValue' }
    },
    // HIDE FOR NOW until we can figure out a better way to reference locations
    // than just typing in the name
    waypoint_options: {
      title: 'Location defaults',
      type: 'dictionary',
      keys: { type: 'reference', collection: 'waypoints' },
      // HMM -- how to refer to embedded subresources?
      values: { type: 'name' },
      display: { hidden: true }
    },
    schedule: {
      title: 'Moment schedule',
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
  validateResource: function(script: ScriptContent, resource: Record<string, any>) {
    if (resource.default && resource.section) {
      return ['Default variants cannot have a section.'];
    }
    if (!resource.default && !resource.section) {
      return ['Non-default variants must have a section.'];
    }
  }
};

export {};
