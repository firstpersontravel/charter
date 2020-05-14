import Ember from 'ember';
import WindowHeightMixin from '../../mixins/panels/window-height';

export default Ember.Component.extend(WindowHeightMixin, {
  classNames: ['page-layout', 'page-layout-tabs'],
  target: Ember.computed.alias('targetObject'),

  selectedTabName: null,

  contentEl: '.page-layout-tabs-content',
  footerEl: '.page-layout-tabs-menu',

  stateDidChange: function() {
    var tabName = this.get('state');
    if (this.get('visibleTabs.length') > 0) {
      if (!this.get('visibleTabs').findBy('title', tabName)) {
        tabName = this.get('visibleTabs')[0].title;
      }
    }
    this.set('selectedTabName', tabName);
  }.observes('state').on('init'),

  tabs: function() {
    var tabSection = this.get('pageLayout.section');
    var scriptContent = this.get('trip.script.content');
    if (!scriptContent) {
      return [];
    }
    var tabPages = scriptContent.content_pages.filterBy('section', tabSection);
    return tabPages;
  }.property('pageLayout'),

  visibleTabs: function() {
    return this.get('tabs').filter(function(tab) {
      if (tab.visible === false) { return false; }
      if (tab.active_if) {
        return this.get('trip').evaluateIf(tab.active_if);
      }
      return true;
    }, this);
  }.property('tabs', 'trip.evalContext'),

  selectedTab: function() {
    var tabName = this.get('selectedTabName');
    var tab = this.get('visibleTabs').findBy('title', tabName);
    return tab || this.get('visibleTabs')[0];
  }.property('tabs', 'selectedTabName'),

  headerPanels: function() {
    var headerPanels =  this.get('pageLayout.header_panels') || [];
    return this.collectPanelPartials(headerPanels);
  }.property('pageLayout', 'pagePanels'),

  collectPanelPartials: function(baseComponents) {
    var collectedPanels = [];
    baseComponents.forEach(function(panel) {
      if (panel.type === 'current_page') {
        var innerPanels = this.get('pagePanels');
        if (!innerPanels || innerPanels.length === 0) {
          innerPanels = [];
          // innerPanels = panel.default_panels || [];
        }
        collectedPanels = collectedPanels.concat(innerPanels);
      } else {
        collectedPanels.push(panel);
      }
    }, this);

    collectedPanels = collectedPanels.filter(panel => (
      this.get('trip').evaluateIf(panel.visible_if)
    ));

    return collectedPanels;    
  },

  tabPanels: function() {
    return this.collectPanelPartials(this.get('selectedTab.panels'));
  }.property('selectedTab', 'pagePanels'),

  actions: {
    selectTab: function(tabName) {
      this.set('selectedTabName', tabName);
      this.set('state', tabName);
    }
  }
});
