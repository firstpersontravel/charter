import DS from 'ember-data';

export default DS.Model.extend({
  user: DS.belongsTo('user', {async: false}),
  scriptName: DS.attr('string'),
  roleName: DS.attr('string'),
  departureName: DS.attr('string'),
  isActive: DS.attr('boolean'),
  photo: DS.attr('string'),
  phoneNumber: DS.attr('string'),
  facetimeUsername: DS.attr('string'),
  skypeUsername: DS.attr('string'),
  values: DS.attr('obj'),
  isArchived: DS.attr('boolean')
});
