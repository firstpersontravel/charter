var _ = require('lodash');

module.exports = {
  help: { summary: 'Occurs when a player hangs up the phone.' },
  specParams: {
    role: { required: true, type: 'reference', collection: 'roles' }
  },
  matchEvent: function(spec, event, actionContext) {
    return _.includes(event.roles, spec.role);
  }
};
