import Ember from 'ember';
import { getPlayerIframeUrl } from '../../utils';

export default Ember.Component.extend({
  classNameBindings: [
    ':page-panel-role-assignment',
    ':page-panel-padded'
  ],

  roles: function() {
    this.role_names;
    trip = this.trip;
    {
      url: getPlayerIframeUrl(trip, player)
    }
  }

  humanizedText: function() {
    return this.get('player').humanizeText(this.get('params.text'));
  }.property('params.text', 'player.evalContext')
});
