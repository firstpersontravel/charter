var _ = require('lodash');

module.exports = {
  help: 'Set a player to a page.',
  params: {
    role_name: {
      required: true,
      type: 'reference',
      collection: 'roles',
      display: { label: false },
      help: 'The player to send to a page.'
    },
    page_name: {
      required: true,
      type: 'reference',
      collection: 'pages',
      allowNull: true,
      help: 'The page to send the player to.'
    }
  },
  applyAction: function(params, actionContext) {
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
    return [{
      operation: 'updatePlayerFields',
      roleName: params.role_name,
      fields: { currentPageName: newPageName }
    }];
  }
};
