var _ = require('lodash');

module.exports = {
  help: 'Set a player to a page by role.',
  params: {
    role_name: {
      required: true,
      type: 'reference',
      collection: 'roles',
      display: { label: false },
      help: 'The role to send to a page.'
    },
    page_name: {
      required: true,
      type: 'reference',
      collection: 'pages',
      allowNull: true,
      help: 'The page to send the matching players to.'
    }
  },
  getOps(params, actionContext) {
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
        [params.role_name]: newPageName
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
