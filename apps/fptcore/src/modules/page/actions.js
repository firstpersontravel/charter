var send_to_page = {
  phraseForm: ['role_name', 'page_name'],
  params: {
    role_name: { required: true, type: 'resource', collection: 'roles' },
    page_name: { required: true, type: 'resource', collection: 'pages' }
  },
  applyAction: function(script, context, params, applyAt) {
    var newPageName = params.page_name !== 'null' ? params.page_name : '';
    // Create updates object
    var updates = { currentPageName: { $set: newPageName } };
    return [{
      operation: 'updatePlayer',
      roleName: params.role_name,
      updates: updates
    }];
  }
};

module.exports = {
  send_to_page: send_to_page
};
