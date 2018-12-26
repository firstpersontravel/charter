import Ember from 'ember';

export default Ember.Controller.extend({

  script: Ember.inject.controller(),
  participant: Ember.inject.controller(),
  trip: Ember.inject.controller(),
  messages: Ember.inject.controller(),

  queryParams: ['state'],
  state: null,

  pageLayoutName: function() {
    var page = this.get('pageModel');
    var participant = this.get('participant.model');
    var pageLayoutName = participant.get('role').default_layout || null;
    if (page.layout !== undefined) { pageLayoutName = page.layout; }
    return pageLayoutName;
  }.property('pageModel'),

  pageLayoutComponentName: function() {
    return 'page-layouts/' + (this.get('pageLayout.type') || 'simple');
  }.property('pageLayout'),

  pageModel: function() {
    var participant = this.get('participant.model');
    var script = participant.get('trip.script');
    if (!participant) {
      return null;
    }
    return script.findPageByName(participant.get('currentPageName'));
  }.property('participant.model.currentPageName'),

  pageLayout: function() {
    var scriptContent = this.get('script.model.content');
    var pageLayoutName = this.get('pageLayoutName');
    if (!pageLayoutName) {
      return null;
    }
    return scriptContent.layouts.findBy('name', pageLayoutName);
  }.property('pageLayoutName'),

  pagePanels: function() {
    var trip = this.get('trip.model');
    var page = this.get('pageModel');
    var pagePanels = {};
    // Assemble list of partials with panels
    var partials = Ember.$.extend({
      main: {panels: page.panels || []}
    }, page.partials || {});

    // Go through each and resolve outlets
    Object.keys(partials).forEach(function(outletName) {
      if (!pagePanels[outletName]) {
        pagePanels[outletName] = [];
      }
      partials[outletName].panels.forEach(function(panel) {
        if (!panel.if || trip.evaluateIf(panel.if)) {
          pagePanels[outletName].push(panel);
        }
      }, this);
    }, this);

    // return resolved
    return pagePanels;
  }.property('pageModel', 'trip.model.evalContext')
});
