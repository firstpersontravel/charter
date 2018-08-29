import Ember from 'ember';

export default Ember.Component.extend({
  tagName: 'li',
  classNameBindings: ':pure-menu-item isSelected:pure-menu-selected'.w(),

  isSelected: function() {
    return this.get('tab.name') === this.get('tabs.selectedTabName');
  }.property('tab.name', 'tabs.selectedTabName'),

  actions: {
    select: function() {
      this.triggerAction({
        action: 'selectTab',
        actionContext: [this.get('tab.name')]
      });
    }
  }
});
