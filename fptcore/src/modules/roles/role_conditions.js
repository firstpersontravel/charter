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
      // Hard-coded dependency that all events with the current role name
      // will include `role_name`.
      return _.get(actionContext.evalContext, 'event.role_name') ===
        params.role_name;
    }
  },
  role_page_is: {
    help: 'Condition passes if a role is on a specific page.',
    properties: {
      role_name: {
        type: 'reference',
        collection: 'roles',
        required: true,
        display: { label: false },
        help: 'The role to check.'
      },
      page_name: {
        type: 'reference',
        collection: 'pages',
        required: true,
        help: 'The page that this role must be on.'
      }
    },
    eval: (params, actionContext) => {
      const tripState = actionContext.evalContext.tripState;
      const curPages = tripState.currentPageNamesByRole || {};
      const curPageName = curPages[params.role_name];
      return curPageName === params.page_name;
    }
  }
};
