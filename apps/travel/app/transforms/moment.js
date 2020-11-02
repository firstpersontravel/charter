import DS from 'ember-data';

export default DS.Transform.extend({
  deserialize: function(serialized) {
    return serialized ? moment.utc(serialized) : null;
  },
  serialize: function(deserialized) {
    return deserialized ? moment.utc(deserialized).toISOString() : null;
  }
});
