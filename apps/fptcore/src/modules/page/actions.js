var send_to_page = {
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
    return [{
      operation: 'updatePlayerFields',
      roleName: params.role_name,
      fields: { currentPageName: newPageName }
    }];
  }
};

module.exports = {
  send_to_page: send_to_page
};
