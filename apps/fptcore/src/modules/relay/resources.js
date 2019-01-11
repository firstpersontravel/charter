var relay = {
  properties: {
    name: { type: 'name', required: true },
    for: { type: 'reference', collection: 'roles', required: true },
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
    return 'For ' + resource.for + ' as ' + resource.as + ' with ' +
      resource.with;
  },
  getParentClaims: function(resource) {
    return ['roles.' + resource.for];
  }
};

module.exports = {
  relay: relay
};
