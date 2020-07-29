import Ember from 'ember';

export default Ember.Controller.extend({

  script: Ember.inject.controller(),
  player: Ember.inject.controller(),
  trip: Ember.inject.controller(),
  messages: Ember.inject.controller(),

  queryParams: ['state'],
  state: null,

  pageInterfaceName: function() {
    var player = this.get('player.model');
    var pageInterfaceName = player.get('role').interface || null;
    return pageInterfaceName;
  }.property('pageModel'),

  pageModel: function() {
    var player = this.get('player.model');
    var script = player.get('trip.script');
    if (!player ||
      !player.get('currentPageName') ||
      player.get('currentPageName') === 'null') {
      return null;
    }
    return (script.content.pages || [])
      .find(p => p.name === player.get('currentPageName'));
  }.property('player.model.currentPageName'),

  pageInterface: function() {
    var scriptContent = this.get('script.model.content');
    var pageInterfaceName = this.get('pageInterfaceName');
    if (!pageInterfaceName) {
      return null;
    }
    return scriptContent.interfaces.findBy('name', pageInterfaceName);
  }.property('pageInterfaceName'),

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
