import DS from 'ember-data';

export default DS.Model.extend({
  trip: DS.belongsTo('trip', {async: false}),
  sentBy: DS.belongsTo('player', {async: false}),
  sentTo: DS.belongsTo('player', {async: false}),
  sentFromLatitude: DS.attr('number'),
  sentFromLongitude: DS.attr('number'),
  sentFromAccuracy: DS.attr('number'),
  name: DS.attr('string'),
  medium: DS.attr('string'),
  content: DS.attr('string'),
  createdAt: DS.attr('moment'),
  readAt: DS.attr('moment'),
  isReplyNeeded: DS.attr('boolean'),
  replyReceivedAt: DS.attr('moment'),
  isArchived: DS.attr('boolean'),

  createdAtLocal: function() {
    return this.get('createdAt').clone().tz(this.get('trip.timezone'));
  }.property('createdAt')
});
