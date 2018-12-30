var _ = require('lodash');

module.exports = {
  call_answered: {
    specParams: {
      from: { required: true, type: 'reference', collection: 'roles' },
      to: { required: true, type: 'reference', collection: 'roles' }
    },
    matchEvent: function(spec, event, actionContext) {
      return spec.from === event.from && spec.to === event.to;
    }
  },

  call_ended: {
    specParams: {
      role: { required: true, type: 'reference', collection: 'roles' }
    },
    matchEvent: function(spec, event, actionContext) {
      return _.includes(event.roles, spec.role);
    }
  },

  call_received: {
    specParams: {
      from: { required: true, type: 'reference', collection: 'roles' },
      to: { required: true, type: 'reference', collection: 'roles' }
    },
    matchEvent: function(spec, event, actionContext) {
      return spec.from === event.from && spec.to === event.to;
    }
  }
};
