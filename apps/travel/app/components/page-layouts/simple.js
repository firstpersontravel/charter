import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['page-layout', 'page-layout-simple'],
  target: Ember.computed.alias('targetObject'),

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
          innerPanels = [];
          // innerPanels = panel.default_panels || [];
        }
        collectedPanels = collectedPanels.concat(innerPanels);
      } else {
        collectedPanels.push(panel);
      }
    }, this);
    return collectedPanels;    
  }
});
