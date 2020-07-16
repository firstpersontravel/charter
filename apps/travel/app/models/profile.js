import DS from 'ember-data';

export default DS.Model.extend({
  participant: DS.belongsTo('participant', {async: false}),
  experience: DS.belongsTo('experience', {async: false}),
  roleName: DS.attr('string'),
  isActive: DS.attr('boolean'),
  photo: DS.attr('string'),
  phoneNumber: DS.attr('string'),
  facetimeUsername: DS.attr('string'),
  skypeUsername: DS.attr('string'),
  values: DS.attr('obj'),
  isArchived: DS.attr('boolean')
});
