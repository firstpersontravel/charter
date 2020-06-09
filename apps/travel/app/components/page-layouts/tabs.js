import Ember from 'ember';
import WindowHeightMixin from '../../mixins/panels/window-height';

const DEFAULT_TABS = [{
  title: 'Main',
  panels: [{ type: 'current_page' }]
}];

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
    var tabs = this.get('pageLayout.tabs');
    return tabs && tabs.length ? tabs : DEFAULT_TABS;
  }.property('pageLayout'),

  visibleTabs: function() {
    return this.get('tabs').filter(tab => {
      if (tab.visible_if) {
        return this.get('player').evaluateIf(tab.visible_if);
      }
      return true;
    }, this);
  }.property('tabs', 'player.evalContext'),

  showTabs: function() {
    return this.get('visibleTabs.length') > 1;
  }.property('visibleTabs'),

  selectedTab: function() {
    var tabName = this.get('selectedTabName');
    var tab = this.get('visibleTabs').findBy('title', tabName);
    return tab || this.get('visibleTabs')[0];
  }.property('tabs', 'selectedTabName'),

  headerPanels: function() {
    // Show page directive if visible, otherwise just experience title.
    const headerPanels = [{
      type: 'text',
      visible_if: { op: 'value_is_true', ref: 'player.directive' },
      text: `{{player.directive}}`,
      style: 'banner'
    }, {
      type: 'text',
      visible_if: {
        op: 'not', item: { op: 'value_is_true', ref: 'player.directive' }
      },
      text: this.get('trip.experience.title'),
      style: 'banner'
    }];
    return this.collectPanelPartials(headerPanels);
  }.property('pageLayout', 'pagePanels'),

  collectPanelPartials: function(basePanels) {
    var collectedPanels = [];
    basePanels.forEach(function(panel) {
      if (panel.type === 'current_page') {
        var innerPanels = this.get('pagePanels');
        if (!innerPanels || innerPanels.length === 0) {
          innerPanels = [{
            type: 'text',
            text: 'Nothing to display at the moment.',
            style: 'centered'
          }];
        }
        collectedPanels = collectedPanels.concat(innerPanels);
      } else {
        collectedPanels.push(panel);
      }
    }, this);

    collectedPanels = collectedPanels.filter(panel => (
      this.get('player').evaluateIf(panel.visible_if)
    ));

    return collectedPanels;    
  },

  tabPanels: function() {
    return this.collectPanelPartials(this.get('selectedTab.panels') || []);
  }.property('selectedTab', 'pagePanels'),

  actions: {
    selectTab: function(tabName) {
      this.set('selectedTabName', tabName);
      this.set('state', tabName);
    }
  }
});
