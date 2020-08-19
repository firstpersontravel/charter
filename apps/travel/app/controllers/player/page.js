import Ember from 'ember';

export default Ember.Controller.extend({
  script: Ember.inject.controller(),
  player: Ember.inject.controller(),
  trip: Ember.inject.controller(),
  messages: Ember.inject.controller(),

  queryParams: ['state'],
  state: null,

  pageInterfaceName: function() {
    const player = this.get('player.model');
    const pageInterfaceName = player.get('role').interface || null;
    return pageInterfaceName;
  }.property('player.model.roleName', 'pageModel'),

  pageModel: function() {
    const roleName = this.get('player.model.roleName');
    const trip = this.get('player.model.trip');
    const pageName = trip.get('tripState.currentPageNamesByRole')[roleName];
    const pages = trip.get('script.content.pages') || [];
    return pages.find(p => p.name === pageName);
  }.property(
    'player.model.roleName',
    'trip.model.tripState.currentPageNamesByRole'),

  pageInterface: function() {
    const scriptContent = this.get('script.model.content');
    const pageInterfaceName = this.get('pageInterfaceName');
    if (!pageInterfaceName) {
      return null;
    }
    return scriptContent.interfaces.findBy('name', pageInterfaceName);
  }.property('pageInterfaceName'),

  filterPanels: function(panels) {
    return (panels || []).filter(p => this.get('player.model').evaluateIf(p.visible_if));
  },

  pagePanels: function() {
    const page = this.get('pageModel');
    return page ? this.filterPanels(page.panels) : [];
  }.property('pageModel', 'player.evalContext')
});
