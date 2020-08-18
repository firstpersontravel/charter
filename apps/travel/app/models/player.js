import Ember from 'ember';
import DS from 'ember-data';
import moment from 'moment-timezone';

import fptCore from 'fptcore';

export default DS.Model.extend({
  trip: DS.belongsTo('trip', {async: false}),
  participant: DS.belongsTo('participant', {async: false}),
  roleName: DS.attr('string'),
  acknowledgedPageName: DS.attr('string'),
  acknowledgedPageAt: DS.attr('moment'),
  values: DS.attr('obj'),

  role: function() {
    return this.get('trip.script').getRole(this.get('roleName'));
  }.property('trip'),

  currentPageName: function() {
    return this.get('trip.tripState.currentPageNamesByRole')[
      this.get('roleName')];
  }.property('trip.tripState'),

  participantProfile: function() {
    if (!this.get('participant.profiles')) {
      return null;
    }
    var profiles = this.get('participant.profiles')
      .filter(profile => (
        profile.get('roleName') === this.get('roleName') &&
        profile.get('experience') === this.get('trip.experience')
      ));
    return profiles[0] || null;
  }.property('participant.profiles'),

  skype: Ember.computed.oneWay('participantProfile.skype'),
  facetime: Ember.computed.oneWay('participantProfile.facetime'),

  photo: function() {
    return this.get('participantProfile.photo') || null;
  }.property('participantProfile'),

  contactName: function() {
    return this.get('role.title');
  }.property('participantProfile', 'participant'),

  firstName: function() {
    return this.get('contactName').split(' ')[0];
  }.property('contactName'),

  // must be invoked on the current player object
  actionContext: function() {
    return {
      scriptContent: this.get('trip.script.content'),
      evalContext: this.get('evalContext'),
      evaluateAt: moment.utc(),
      timezone: this.get('trip.experience.timezone'),
      triggeringPlayerId: this.id,
      triggeringRoleName: this.get('roleName')
    };
  }.property('evalContext'),

  humanizeText: function(text) {
    return fptCore.TemplateUtil.templateText(
      this.get('evalContext'), text,
      this.get('trip.experience.timezone'),
      this.get('roleName'));
  },

  evaluateIf: function(ifClause) {
    return fptCore.coreEvaluator.if(this.get('actionContext'), ifClause);
  },

  evalContext: function() {
    const env = { host: this.get('environment.host') };
    const trip = this.get('trip').getCombinedTripData();
    const context = fptCore.ContextCore.gatherEvalContext(env, trip);
    return context;
  }.property(
    'values',
    'trip.players.@each.currentPageName',
    'trip.players.@each.values'),

  lookupRef: function(ref) {
    var context = this.get('evalContext');
    return fptCore.TemplateUtil.lookupRef(context, ref);
  },
});
