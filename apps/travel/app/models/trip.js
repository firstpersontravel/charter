import DS from 'ember-data';

export default DS.Model.extend({

  script: DS.belongsTo('script', {async: false}),
  experience: DS.belongsTo('experience', {async: false}),

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
    trip.tripId = this.id;
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
      var user = player.get('user');
      if (user) {
        p.user = user.toJSON();
        const profile = user.get('profiles').filter(profile => (
          profile.get('experience') === experience &&
          profile.get('roleName') === p.roleName
        ))[0];
        if (profile) {
          p.user.profile = profile.toJSON();
          p.user.profile.values = JSON.parse(p.user.profile.values);
        }
      }
      return p;
    }));
    return trip;
  }
});
