import Ember from 'ember';

export default Ember.Component.extend({
  classNameBindings: [
    ':messages-item',
    'mediumClass',
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
    var type = this.get('message.medium');
    var url = this.get('message.content');
    if (type === 'image') {
      $.featherlight(url, {closeOnClick: 'anywhere'});
    }    
  },

  mediumClass: function() {
    return 'messages-item-' + this.get('message.medium');
  }.property('message'),

  messageSenderClass: function() {
    var asPlayer = this.get('asPlayer');
    var fromPlayer = this.get('message.sentBy');
    var fromSelf = asPlayer.id === fromPlayer.id;
    return 'messages-item-' + (fromSelf ? 'outgoing' : 'incoming');
  }.property('message'),

  createdAtLocal: function() {
    return this.get('message.createdAt').clone().local().format('h:mma');
  }.property('message.createdAt'),

  content: function() {
    var type = this.get('message.medium');
    var content = this.get('message.content');
    if (type === 'text') {
      return this.get('player').humanizeText(content);
    }
    if (type === 'image') {
      return `<img src='${content}'/>`;
    } else if (type === 'audio') {
      return `<audio src='${content}' controls></audio>`;
    } else {
      return "";
    }
  }.property('message.medium', 'message.content')
});
