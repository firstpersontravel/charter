import Ember from 'ember';
import $ from 'jquery';

export default Ember.Controller.extend({

  playthrough: Ember.inject.controller(),

  // Messy solution until store.filter is ready.
  allMessages: function() {
    return this.store.peekAll('message');
  }.property(),

  // Messy solution until store.filter is ready.
  model: function() {
    var playthrough = this.get('playthrough.model');
    return this.get('allMessages').filterBy('playthrough', playthrough);
  }.property('playthrough.model', 'allMessages.@each.playthrough'),

  notifyMessage: function(message) {
    var sentBy = message.get('sentBy');
    var messageFromName = sentBy.get('firstName') ||
      sentBy.get('contactName') ||
      sentBy.get('roleName');
    var messageTitle = "New message from " + messageFromName;
    var messageContent = "";

    // Only show message content if our width is > 700
    // (tablet vertical is 768)
    var TABLET_WIDTH = 700;
    if ($(document).width() > TABLET_WIDTH) {
      var playthrough = this.get('playthrough.model');
      if (message.get('messageType') === 'text') {
        messageContent = playthrough.humanizeText(message.get('messageContent'));
      } else if (message.get('messageType') === 'image') {
        var url = playthrough.get('script').urlForContentPath(
          message.get('messageContent'));
        messageContent = "<img src='" + url + "'>";
      }
    }
    swal({
      title: messageTitle,
      text: messageContent,
      html: true,
      allowOutsideClick: true
    }, function() {
      // no need to transition after a single message, since you can
      // read it right there.
      if (message.get('messageType') !== 'text') {
        this.transitionToRoute({queryParams: {state: 'messages'}});
      }
    }.bind(this));
  }
});
