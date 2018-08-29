import Ember from 'ember';

export default Ember.Component.extend({
  classNameBindings: [
    ':messages-item',
    'messageTypeClass',
    'messageSenderClass'
  ],

  click: function(e) {
    if (e.target.tagName === 'IMG') {
      Ember.run.once(this, this.openLightbox);
    }
  },

  touchStart: function(e) {
    this._touchStarted = true;
  },

  touchEnd: function(e) {
    if (this._touchStarted && e.target.tagName === 'IMG') {
      Ember.run.later(this, this.openLightbox, 200);
    }
    this._touchStarted = false;
  },

  openLightbox: function() {
    var type = this.get('message.messageType');
    var content = this.get('message.messageContent');
    if (type === 'image') {
      var url = this.get('playthrough.script').urlForContentPath(content);
      $.featherlight(url, {closeOnClick: 'anywhere'});
    }    
  },

  messageTypeClass: function() {
    return 'messages-item-' + this.get('message.messageType');
  }.property('message'),

  messageSenderClass: function() {
    var asParticipant = this.get('asParticipant');
    var fromParticipant = this.get('message.sentBy');
    var fromSelf = asParticipant.id === fromParticipant.id;
    return 'messages-item-' + (fromSelf ? 'outgoing' : 'incoming');
  }.property('message'),

  createdAtLocal: function() {
    return this.get('message.createdAt').clone().local().format('h:mma');
  }.property('message.createdAt'),

  messageContent: function() {
    var type = this.get('message.messageType');
    var content = this.get('message.messageContent');
    if (type === 'text') {
      return this.get('playthrough').humanizeText(content);
    }
    var url = this.get('playthrough.script').urlForContentPath(content);
    if (type === 'image') {
      return `<img src='${url}'/>`;
    } else if (type === 'audio') {
      return `<audio src='${url}' controls></audio>`;
    } else {
      return "";
    }
  }.property('message.messageType', 'message.messageContent')
});
