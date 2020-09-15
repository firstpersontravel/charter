import Ember from 'ember';
import $ from 'jquery';

import WindowHeightMixin from '../../mixins/panels/window-height';

export default Ember.Component.extend(WindowHeightMixin, {

  contentEl: '.page-panel-content-browse, .content-detail',
  footerEl: '.page-layout-tabs-menu',

  selectedItemName: Ember.computed.alias('substate'),

  visibleItems: function() {
    var scriptContent = this.get('trip.script.content');
    var section = this.get('params.section');
    if (!scriptContent || !scriptContent.content_pages) { return []; }
    var sectionItems = scriptContent.content_pages
      .filterBy('section', section)
      .sortBy('title');
    return sectionItems.filter(item => this.get('player').evaluateIf(item.active_if));
  }.property('params.section', 'player.evalContext'),

  menu: function() {
    var selectedItemName = this.get('selectedItemName');
    return this.get('visibleItems').map(function(item) {
      var isSelected = item.name === selectedItemName;
      return $.extend({}, item, {isSelected: isSelected});
    });
  }.property('visibleItems', 'selectedItemName'),

  selectedItem: function() {
    var itemName = this.get('selectedItemName');
    var item = this.get('visibleItems').findBy('name', itemName);
    if (!item) { item = this.get('visibleItems')[0]; }
    return item;
  }.property('visibleItems', 'selectedItemName'),

  init: function() {
    this._super();
    this.checkItemIsVisible();
  },

  checkItemIsVisible: function() {
    var itemName = this.get('selectedItemName');
    var visibleItems = this.get('visibleItems');
    var item = visibleItems.findBy('name', itemName);
    if (!item && visibleItems.length > 0) {
      this.set('selectedItemName', visibleItems[0].name);
    }    
  },

  visibleItemsDidChange: function() {
    this.checkItemIsVisible();
  }.observes('visibleItems'),

  actions: {
    selectItem: function(itemName) {
      this.set('selectedItemName', itemName);
    }
  }
});
