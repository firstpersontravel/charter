var _ = require('lodash');

module.exports = {
  specParams: {
    role: { required: true, type: 'resource', collection: 'roles' }
  },
  matchEvent: function(script, context, spec, event) {
    return _.includes(event.roles, spec.role);
  }
};
