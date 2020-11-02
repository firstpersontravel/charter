import DS from 'ember-data';

export default DS.Model.extend({
  org: DS.belongsTo('org', {async: false}),
  experience: DS.belongsTo('experience', {async: false}),

  email: DS.attr('string'),
  name: DS.attr('string'),
  phoneNumber: DS.attr('string'),
  isActive: DS.attr('boolean'),

  deviceId: DS.attr('string'),
  devicePushToken: DS.attr('string'),
  locationLatitude: DS.attr('number'),
  locationLongitude: DS.attr('number'),
  locationAccuracy: DS.attr('number'),
  locationTimestamp: DS.attr('moment'),
  deviceBattery: DS.attr('number'),
  deviceLastActive: DS.attr('moment'),
  deviceTimestamp: DS.attr('moment'),

  players: DS.hasMany('player', {async: false}),
  profiles: DS.hasMany('profile', {async: false}),
});
