var _ = require('lodash');

module.exports = {
  call_answered: {
    help: { summary: 'Occurs when a player answers a call.' },
    specParams: {
      from: { required: true, type: 'reference', collection: 'roles' },
      to: { required: true, type: 'reference', collection: 'roles' }
    },
    matchEvent: function(spec, event, actionContext) {
      return spec.from === event.from && spec.to === event.to;
    }
  },

  call_ended: {
    help: { summary: 'Occurs when a player hangs up the phone.' },
    specParams: {
      role: { required: true, type: 'reference', collection: 'roles' }
    },
    matchEvent: function(spec, event, actionContext) {
      return _.includes(event.roles, spec.role);
    }
  },

  call_received: {
    help: { summary: 'Occurs when a player receives a call.' },
    specParams: {
      from: { required: true, type: 'reference', collection: 'roles' },
      to: { required: true, type: 'reference', collection: 'roles' }
    },
    matchEvent: function(spec, event, actionContext) {
      return spec.from === event.from && spec.to === event.to;
    }
  }
};
