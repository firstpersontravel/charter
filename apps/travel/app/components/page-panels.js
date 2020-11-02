import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['page-panels'],
  target: Ember.computed.alias('targetObject'),

  init: function() {
    this._super();
    this._cachedPanelsById = {};
  },

  // Cache panels by ID so as not to re-render views each time they're re-fetched.
  cachedPanels: function() {
    return (this.get('panels') || []).map(panel => {
      if (!this._cachedPanelsById[panel.id]) {
        this._cachedPanelsById[panel.id] = panel;
      }
      return this._cachedPanelsById[panel.id];
    });
  }.property('panels')
});
