var _ = require('lodash');

module.exports = {
  icon: 'phone',
  title: 'Phone line',
  help: 'A phone number by which one player can contact another via text or phone calls.',
  properties: {
    name: { type: 'name', required: true },
    for: {
      type: 'reference',
      collection: 'roles',
      required: true,
      parent: true,
      help: 'The role who will be sending or receiving messages through this phone line.'
    },
    with: {
      title: 'Counterpart',
      type: 'reference',
      collection: 'roles',
      required: true,
      help: 'The role that is being messaged with.'
    },
    as: {
      title: 'Impersonating',
      type: 'reference',
      collection: 'roles',
      help: 'In cases where you want a participant to impersonate a different role, this is the role that is being impersonated. Otherwise this can be left blank.'
    },
    entryway: {
      type: 'boolean',
      default: false,
      help: 'If this value is true, the phone line will be assigned a universal number. New players can text this number to start a new trip.'
    }
  },
  getTitle: function(scriptContent, resource) {
    var parts = [];
    if (resource.with) {
      var withRole = _.find(scriptContent.roles, { name: resource.with });
      if (withRole) {
        parts.push('with ' + withRole.title);
      }
    }
    if (resource.as && resource.as !== resource.for) {
      var asRole = _.find(scriptContent.roles, { name: resource.as });
      if (asRole) {
        parts.push('as ' + asRole.title);
      }
    }
    if (!parts.length) {
      return 'new';
    }
    return parts.join(' ');
  },
  validateResource: function(scriptContent, resource) {
    if (resource.entryway && _.filter(scriptContent.relays, { entryway: true }).length > 1) {
      return ['Every script may have at most one entryway phone line.'];
    }
  }
};
