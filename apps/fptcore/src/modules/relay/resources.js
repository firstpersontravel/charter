var relay = {
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
    phone_autoreply: { type: 'string' },
    sms_out: { type: 'boolean', default: false },
    sms_in: { type: 'boolean', default: false }
  },
  getTitle: function(scriptContent, resource) {
    var parts = [];
    if (resource.for) {
      parts.push('for ' + resource.for);
    }
    if (resource.as) {
      parts.push(' as ' + resource.as);
    }
    if (resource.with) {
      parts.push(resource.with);
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
