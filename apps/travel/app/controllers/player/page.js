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
    var pageLayoutName = player.get('role').interface || null;
    return pageLayoutName;
  }.property('pageModel'),

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
    return scriptContent.interfaces.findBy('name', pageLayoutName);
  }.property('pageLayoutName'),

  filterPanels: function(panels) {
    if (!panels) {
      return [];
    }
    return panels.filter(panel => {
      return this.get('player.model').evaluateIf(panel.visible_if);
    });
  },

  pagePanels: function() {
    var page = this.get('pageModel');
    return page ? this.filterPanels(page.panels) : [];
  }.property('pageModel', 'player.evalContext')
});
