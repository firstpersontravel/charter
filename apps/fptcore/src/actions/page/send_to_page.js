function sendToPage(script, context, params, applyAt) {
  var newPageName = params.page_name !== 'null' ? params.page_name : '';
  // Create updates object
  var updates = { currentPageName: { $set: newPageName } };
  return [{
    operation: 'updatePlayer',
    roleName: params.role_name,
    updates: updates
  }];
}

sendToPage.phraseForm = ['role_name', 'page_name'];

sendToPage.params = {
  role_name: { required: true, type: 'resource', collection: 'roles' },
  page_name: { required: true, type: 'resource', collection: 'pages' }
};

module.exports = sendToPage;
