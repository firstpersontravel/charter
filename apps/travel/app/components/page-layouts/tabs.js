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
    if (!this.get('visibleTabs').findBy('name', tabName)) {
      tabName = this.get('visibleTabs')[0].name;
    }
    this.set('selectedTabName', tabName);
  }.observes('state').on('init'),

  tabs: function() {
    var tabSection = this.get('pageLayout.section');
    var scriptContent = this.get('playthrough.script.content');
    if (!scriptContent) {
      return [];
    }
    var tabPages = scriptContent.content_pages.filterBy('section', tabSection);
    return tabPages;
  }.property('pageLayout'),

  visibleTabs: function() {
    return this.get('tabs').filter(function(tab) {
      if (tab.visible === false) { return false; }
      if (tab.if) { return this.get('playthrough').evaluateIf(tab.if); }
      return true;
    }, this);
  }.property('tabs', 'playthrough.evalContext'),

  selectedTab: function() {
    var tabName = this.get('selectedTabName');
    var tab = this.get('visibleTabs').findBy('name', tabName);
    return tab || this.get('visibleTabs')[0];
  }.property('tabs', 'selectedTabName'),

  headerPanels: function() {
    var headerPanels =  this.get('pageLayout.header_panels') || [];
    return this.collectPanelPartials(headerPanels);
  }.property('pageLayout', 'pagePanels'),

  collectPanelPartials: function(baseComponents) {
    var collectedPanels = [];
    baseComponents.forEach(function(panel) {
      if (panel.type === 'outlet') {
        var innerPanels = this.get('pagePanels')[panel.name];
        if (!innerPanels || innerPanels.length === 0) {
          innerPanels = panel.default_panels || [];
        }
        collectedPanels = collectedPanels.concat(innerPanels);
      } else {
        collectedPanels.push(panel);
      }
    }, this);
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
