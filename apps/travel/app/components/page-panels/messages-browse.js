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

  asParticipant: function() {
    var roleName;
    if (this.get('params.as')) {
      roleName = this.get('params.as');
    } else {
      roleName = this.get('participant.roleName');
    }
    return this.get('playthrough.participants').findBy('roleName', roleName);
  }.property('params', 'participant.roleName'),

  messagesWithSelf: function() {
    var asParticipant = this.get('asParticipant');
    var messages = this.get('playthrough.messages');
    return messages
      .filter(function(message) {
        return (
          message.get('sentBy') === asParticipant ||
          message.get('sentTo') === asParticipant);
      })
      .sort(function(a, b) {
        return Ember.compare(
          a.get('createdAt').valueOf(),
          b.get('createdAt').valueOf());
      });
  }.property('params', 'playthrough.messages.length'),

  contacts: function() {
    // Senders sorted by who wrote to you most recently, most recent first.
    var asParticipant = this.get('asParticipant');
    var participants = this.get('playthrough.participants');
    var addedRoleNames = asParticipant.get('values.accessible_contacts') || [];
    var accessibleContacts = addedRoleNames
      .map(function(roleName) {
        return participants.findBy('roleName', roleName);
      });
    var messagesWithSelf = this.get('messagesWithSelf');
    var uniqueOrderedContacts = messagesWithSelf
      .reverse()
      .map(function(m) {
        var isIncoming = m.get('sentTo') === asParticipant;
        // return other person
        return isIncoming ? m.get('sentBy') : m.get('sentTo');
      })
      .concat(accessibleContacts)
      .uniq();
    return uniqueOrderedContacts.rejectBy('id', asParticipant.id);
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
      as: this.get('asParticipant.roleName'),
      with: this.get('selectedContact.roleName')
    };
  }.property('selectedContact'),

  actions: {
    selectContact: function(contact) {
      this.set('selectedContact', contact);
    }
  }
});
