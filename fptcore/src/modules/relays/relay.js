var _ = require('lodash');

module.exports = {
  icon: 'phone',
  help: 'A phone number by which one player can contact another via text or phone calls.',
  properties: {
    name: { type: 'name', required: true },
    for: {
      type: 'reference',
      collection: 'roles',
      required: true,
      parent: true,
      help: 'The role who will be sending or receiving messages through this relay'
    },
    as: {
      type: 'reference',
      collection: 'roles',
      required: true,
      help: 'The role whose messages are received and sent. This will usually be the same as the "for" role, except when you want the "for" role to be impersonating somebody else. In that case, the "as" role is the role being impersonated.'
    },
    with: {
      type: 'reference',
      collection: 'roles',
      required: true,
      help: 'The role that is being messaged with.'
    },
    entryway: {
      type: 'boolean',
      default: false,
      help: 'If this value is true, the relay will be assigned a universal number. New players can text this number to start a new trip.'
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
  }
};
