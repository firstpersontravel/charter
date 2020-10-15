import DS from 'ember-data';

export default DS.Model.extend({

  group: DS.belongsTo('group', {async: false}),
  script: DS.belongsTo('script', {async: false}),
  experience: DS.belongsTo('experience', {async: false}),

  // Extra fields inserted by the legacy API
  authToken: DS.attr('string'),
  videoToken: DS.attr('string'),
  preloadUrls: DS.attr('obj'),

  date: DS.attr('string'),
  templateName: DS.attr('string'),
  tripState: DS.attr('obj'),
  title: DS.attr('string'),
  customizations: DS.attr('obj'),
  values: DS.attr('obj'),
  waypointOptions: DS.attr('obj'),
  schedule: DS.attr('obj'),
  history: DS.attr('obj'),

  players: DS.hasMany('player', {async: false}),
  messages: DS.hasMany('message', {async: false}),

  currentSceneName: function() {
    return this.get('tripState').currentSceneName;
  }.property('tripState'),

  getCombinedTripData: function() {
    var experience = this.get('experience');
    var script = this.get('script').toJSON();
    script.content = JSON.parse(script.content);
    var trip = this.toJSON();
    trip.id = this.id;
    trip.script = script;
    trip.schedule = JSON.parse(trip.schedule);
    trip.tripState = JSON.parse(trip.tripState);
    trip.history = JSON.parse(trip.history);
    trip.waypointOptions = JSON.parse(trip.waypointOptions);
    trip.customizations = JSON.parse(trip.customizations);
    trip.values = JSON.parse(trip.values);
    trip.players = this.get('players').map(((player) => {
      var p = player.toJSON();
      p.id = Number(player.id);
      var participant = player.get('participant');
      if (participant) {
        p.participant = participant.toJSON();
        const profile = participant.get('profiles').filter(profile => (
          profile.get('experience') === experience &&
          profile.get('roleName') === p.roleName
        ))[0];
        if (profile) {
          p.participant.profile = profile.toJSON();
          p.participant.profile.values = JSON.parse(p.participant.profile.values);
        }
      }
      return p;
    }));
    return trip;
  }
});
