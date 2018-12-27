import Ember from 'ember';
import WindowHeightMixin from '../../mixins/panels/window-height';

export default Ember.Component.extend(WindowHeightMixin, {

  target: Ember.computed.alias('targetObject'),

  sync: Ember.inject.service(),
  time: Ember.inject.service(),
  media: Ember.inject.service(),

  messageInput: '',
  contentEl: '.page-panel-messages-browse, .messages-detail',
  footerEl: '.page-layout-tabs-menu',

  init: function() {
    this._super();
    if (!this.get('selectedContact')) {
      var firstContact = this.get('contacts')[0];
      this.set('selectedContact', firstContact);
    }
  },

  asPlayer: function() {
    var roleName;
    if (this.get('params.as')) {
      roleName = this.get('params.as');
    } else {
      roleName = this.get('player.roleName');
    }
    return this.get('trip.players').findBy('roleName', roleName);
  }.property('params', 'player.roleName'),

  messagesWithSelf: function() {
    var asPlayer = this.get('asPlayer');
    var messages = this.get('trip.messages');
    return messages
      .filter(function(message) {
        return (
          message.get('sentBy') === asPlayer ||
          message.get('sentTo') === asPlayer);
      })
      .sort(function(a, b) {
        return Ember.compare(
          a.get('createdAt').valueOf(),
          b.get('createdAt').valueOf());
      });
  }.property('params', 'trip.messages.length'),

  contacts: function() {
    // Senders sorted by who wrote to you most recently, most recent first.
    var asPlayer = this.get('asPlayer');
    var messagesWithSelf = this.get('messagesWithSelf');
    var uniqueOrderedContacts = messagesWithSelf
      .reverse()
      .map(function(m) {
        var isIncoming = m.get('sentTo') === asPlayer;
        // return other person
        return isIncoming ? m.get('sentBy') : m.get('sentTo');
      })
      .uniq();
    return uniqueOrderedContacts.rejectBy('id', asPlayer.id);
  }.property('params', 'messagesWithSelf'),

  menu: function() {
    var selectedContact = this.get('selectedContact');
    return this.get('contacts').map(function(contact) {
      var contactName = contact.get('contactName') || contact.get('roleName');
      return {
        contact: contact,
        isSelected: contact === selectedContact,
        contactName: contactName
      };
    });
  }.property('contacts', 'selectedContact'),

  didInsertElement: function() {
    this._super();
    Ember.run.next(this, 'scrollBottom');
  },

  selectedContactDidChange: function() {
    Ember.run.next(this, 'scrollBottom');
  }.observes('selectedContact'),

  scrollBottom: function() {
    var $el = this.$('.messages-detail');
    $el.scrollTop($el.prop('scrollHeight'));
  },

  selectedContact: null,

  messagesParams: function() {
    return {
      as: this.get('asPlayer.roleName'),
      with: this.get('selectedContact.roleName')
    };
  }.property('selectedContact'),

  actions: {
    selectContact: function(contact) {
      this.set('selectedContact', contact);
    }
  }
});
