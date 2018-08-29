import DS from 'ember-data';

export default DS.Transform.extend({
  deserialize: function(serialized) {
    if (typeof serialized === 'object') { return serialized; }
    return JSON.parse(serialized);
  },
  serialize: function(deserialized) {
    return JSON.stringify(deserialized);
  }
});
