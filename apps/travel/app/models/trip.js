import Ember from 'ember';
import DS from 'ember-data';

import RefUtils from '../utils/ref';

import fptCore from 'npm:fptcore';

export default DS.Model.extend({

  environment: Ember.inject.service(),

  script: DS.belongsTo('script', {async: false}),
  date: DS.attr('string'),
  templateName: DS.attr('string'),
  departureName: DS.attr('string'),
  currentSceneName: DS.attr('string'),
  title: DS.attr('string'),
  customizations: DS.attr('obj'),
  values: DS.attr('obj'),
  waypointOptions: DS.attr('obj'),
  schedule: DS.attr('obj'),
  history: DS.attr('obj'),

  players: DS.hasMany('player', {async: false}),
  messages: DS.hasMany('message', {async: false}),

  createLocalAction: function(name, params, scheduledAt, triggerName) {
    var newAction = this.store.createRecord('action', {
      trip: this,
      name: name,
      params: params,
      triggerName: triggerName || '',
      createdAt: moment.utc(),
      scheduledAt: scheduledAt || moment.utc(),
      appliedAt: null,
      failedAt: null
    });
    // newAction.save();
    return newAction;
  },

  evaluateIf: function(ifClause) {
    return fptCore.EvalCore.if(this.get('evalContext'), ifClause);
  },

  generateTrip: function() {
    var script = this.get('script').toJSON();
    script.content = JSON.parse(script.content);
    var trip = this.toJSON();
    trip.script = script;
    trip.schedule = JSON.parse(trip.schedule);
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
          profile.get('scriptName') === script.name &&
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
  },

  evalContext: function() {
    var env = { host: this.get('environment.host') };
    var context = fptCore.ContextCore.gatherEvalContext(env, this.generateTrip());
    return context;
  }.property(
    'values',
    'players.@each.currentPageName',
    'players.@each.values'),

  lookupRef: function(ref) {
    var context = this.get('evalContext');
    return fptCore.EvalCore.lookupRef(context, ref);
  },

  setValue: function(valueRef, newValue) {
    this.setValues([[valueRef, newValue]]);
  },

  setValues: function(valuePairs) {
    var valuesCopy = Ember.$.extend(true, {}, this.get('values'));
    valuePairs.forEach(function(arr) {
      RefUtils.updateValues(valuesCopy, arr[0], arr[1]);
    });
    this.set('values', valuesCopy);
  },

  humanizeText: function(text) {
    return fptCore.EvalCore.templateText(this.get('evalContext'), text,
      this.get('script.timezone'));
  }
});
