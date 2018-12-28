var send_to_page = {
  phraseForm: ['role_name', 'page_name'],
  params: {
    role_name: { required: true, type: 'reference', collection: 'roles' },
    page_name: { required: true, type: 'reference', collection: 'pages' }
  },
  applyAction: function(script, context, params, applyAt) {
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
