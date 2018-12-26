function stopAudio(script, context, params, applyAt) {
  return [{
    operation: 'updatePlayer',
    roleName: params.role_name,
    updates: {
      values: {
        audio: {
          $set: null
        }
      }
    }
  }, {
    operation: 'updateAudio'
  }];
}

stopAudio.phraseForm = ['role_name'];

stopAudio.params = {
  role_name: { required: true, type: 'resource', collection: 'roles' }
};

module.exports = stopAudio;
