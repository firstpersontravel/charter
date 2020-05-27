var _ = require('lodash');

module.exports = {
  help: 'Set a role to a page.',
  params: {
    role_name: {
      required: true,
      type: 'reference',
      collection: 'roles',
      display: { label: false },
      specialValues: [{ value: 'current', label: 'Current' }],
      help: 'The role to send to a page.'
    },
    page_name: {
      required: true,
      type: 'reference',
      collection: 'pages',
      specialValues: [{ value: 'null', label: 'None' }],
      help: 'The page to send the matching players to.'
    }
  },
  getOps(params, actionContext) {
    let roleName = params.role_name;
    if (roleName === 'current') {
      const curRoleName = _.get(actionContext.evalContext, 'event.role_name');
      if (!curRoleName) {
        return [{
          operation: 'log',
          level: 'error',
          message: 'No current role in event when expected.'
        }];
      }
      roleName = curRoleName;
    }
    var newPageName = params.page_name !== 'null' ? params.page_name : '';
    if (newPageName !== '') {
      var page = _.find(actionContext.scriptContent.pages,
        { name: newPageName });
      if (!page) {
        return [{
          operation: 'log',
          level: 'error',
          message: 'Could not find page named "' + newPageName + '".'
        }];
      }
    }
    const newPageNames = Object.assign({},
      actionContext.evalContext.tripState.currentPageNamesByRole, {
        [roleName]: newPageName
      });
    const newTripState = Object.assign({},
      actionContext.evalContext.tripState, {
        currentPageNamesByRole: newPageNames
      });
    return [{
      operation: 'updateTripFields',
      fields: { tripState: newTripState }
    }];
  }
};
