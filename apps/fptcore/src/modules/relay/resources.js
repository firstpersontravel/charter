var _ = require('lodash');

var relay = {
  help: {
    summary: 'A relay defines a text or phone interface from one player to another.'
  },
  properties: {
    name: { type: 'name', required: true },
    for: {
      type: 'reference',
      collection: 'roles',
      required: true,
      parent: true
    },
    with: { type: 'reference', collection: 'roles', required: true },
    as: { type: 'reference', collection: 'roles', required: true },
    trailhead: { type: 'boolean', default: false },
    admin_out: { type: 'boolean', default: false },
    phone_out: { type: 'boolean', default: false },
    phone_in: { type: 'boolean', default: false },
    phone_autoreply: { type: 'media', medium: 'audio' },
    sms_out: { type: 'boolean', default: false },
    sms_in: { type: 'boolean', default: false }
  },
  getTitle: function(scriptContent, resource) {
    var parts = [];
    if (resource.for) {
      var forRole = _.find(scriptContent.roles, { name: resource.for });
      if (forRole) {
        parts.push('for ' + forRole.title);
      }
    }
    if (resource.as) {
      var asRole = _.find(scriptContent.roles, { name: resource.as });
      if (asRole) {
        parts.push(' as ' + asRole.title);
      }
    }
    if (resource.with) {
      var withRole = _.find(scriptContent.roles, { name: resource.with });
      if (withRole) {
        parts.push(' with ' + withRole.title);
      }
    }
    if (!parts.length) {
      return 'new';
    }
    return parts.join(' ');
  },
  getParentClaims: function(resource) {
    return ['roles.' + resource.for];
  }
};

module.exports = {
  relay: relay
};
