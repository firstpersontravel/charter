import Ember from 'ember';

export default Ember.Controller.extend({

  script: Ember.inject.controller(),
  player: Ember.inject.controller(),
  trip: Ember.inject.controller(),
  messages: Ember.inject.controller(),

  queryParams: ['state'],
  state: null,

  pageLayoutName: function() {
    var page = this.get('pageModel');
    var player = this.get('player.model');
    var pageLayoutName = player.get('role').layout || null;
    if (page && page.layout) { pageLayoutName = page.layout; }
    return pageLayoutName;
  }.property('pageModel'),

  pageLayoutComponentName: function() {
    if (!this.get('pageModel')) {
      return 'page-layouts/null';
    }
    return 'page-layouts/' + (this.get('pageLayout.type') || 'simple');
  }.property('pageLayout'),

  pageModel: function() {
    var player = this.get('player.model');
    var script = player.get('trip.script');
    if (!player ||
      !player.get('currentPageName') ||
      player.get('currentPageName') === 'null') {
      return null;
    }
    return script.findPageByName(player.get('currentPageName'));
  }.property('player.model.currentPageName'),

  pageLayout: function() {
    var scriptContent = this.get('script.model.content');
    var pageLayoutName = this.get('pageLayoutName');
    if (!pageLayoutName) {
      return null;
    }
    return scriptContent.layouts.findBy('name', pageLayoutName);
  }.property('pageLayoutName'),

  filterPanels: function(panels) {
    if (!panels) {
      return [];
    }
    var trip = this.get('trip.model');
    return panels.filter(function(panel) {
      return trip.evaluateIf(panel.visible_if);
    });
  },

  pagePanels: function() {
    var page = this.get('pageModel');
    if (!page) {
      return {};
    }

    var pagePanels = {};
    // Assemble list of partials with panels
    var partials = Ember.$.extend({
      main: {panels: this.filterPanels(page.panels)}
    }, page.partials || {});

    // Go through each and resolve outlets
    Object.keys(partials).forEach(function(outletName) {
      pagePanels[outletName] = partials[outletName].panels;
    }, this);

    // return resolved
    return pagePanels;
  }.property('pageModel', 'trip.model.evalContext')
});
