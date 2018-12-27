var _ = require('lodash');

module.exports = {
  call_answered: {
    specParams: {
      from: { required: true, type: 'resource', collection: 'roles' },
      to: { required: true, type: 'resource', collection: 'roles' }
    },
    matchEvent: function(script, context, spec, event) {
      return spec.from === event.from && spec.to === event.to;
    }
  },

  call_ended: {
    specParams: {
      role: { required: true, type: 'resource', collection: 'roles' }
    },
    matchEvent: function(script, context, spec, event) {
      return _.includes(event.roles, spec.role);
    }
  },

  call_received: {
    specParams: {
      from: { required: true, type: 'resource', collection: 'roles' },
      to: { required: true, type: 'resource', collection: 'roles' }
    },
    matchEvent: function(script, context, spec, event) {
      return spec.from === event.from && spec.to === event.to;
    }
  }
};