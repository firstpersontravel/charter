const _ = require('lodash');

module.exports = {
  current_role_is: {
    help: 'Condition passes if the current player has a specific role.',
    properties: {
      role_name: {
        type: 'reference',
        collection: 'roles',
        required: true,
        display: { label: false },
        help: 'The role to check against the current player.'
      }
    },
    eval: (params, actionContext) => {
      return _.get(actionContext.evalContext, 'event.role_name') ===
        params.role_name;
    }
  }
};
