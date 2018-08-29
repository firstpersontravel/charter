import DS from 'ember-data';

export default DS.Model.extend({
  playthrough: DS.belongsTo('playthrough', {async: false}),
  name: DS.attr('string'),
  params: DS.attr('obj'),
  triggerName: DS.attr('string'),
  event: DS.attr('obj'),
  createdAt: DS.attr('moment'),
  scheduledAt: DS.attr('moment'),
  appliedAt: DS.attr('moment'),
  failedAt: DS.attr('moment')
});
