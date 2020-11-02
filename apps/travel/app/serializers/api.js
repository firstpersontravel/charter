import DS from 'ember-data';

export default DS.JSONAPISerializer.extend({

  // API Serializer calls itself, rather than looking up serializer in store.
  _normalizeResourceHelper: function(resourceHash) {
    var modelName = this.modelNameFromPayloadKey(resourceHash.type);
    var modelClass = this.store.modelFor(modelName);
    var data = this.normalize(modelClass, resourceHash);
    return data.data;
  }
});
