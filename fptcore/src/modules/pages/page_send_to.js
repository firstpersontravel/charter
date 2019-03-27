var _ = require('lodash');

module.exports = {
  help: { summary: 'Set a player to a page.' },
  phraseForm: ['role_name', 'page_name'],
  params: {
    role_name: {
      required: true,
      type: 'reference',
      collection: 'roles',
      display: { primary: true }
    },
    page_name: { required: true, type: 'reference', collection: 'pages',
      allowNull: true }
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
