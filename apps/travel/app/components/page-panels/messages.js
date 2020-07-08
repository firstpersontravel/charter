import Ember from 'ember';
import config from '../../config/environment';
import guid from '../../utils/guid';

import fptCore from 'fptcore';

export default Ember.Component.extend({

  environment: Ember.inject.service(),
  sync: Ember.inject.service(),
  time: Ember.inject.service(),
  media: Ember.inject.service(),

  classNames: ['page-panel-messages'],

  isSendingMessage: false,

  displayCountInitial: 10,
  displayCount: 10,
  displayIncrease: 10,

  paramsDidChange: function() {
    this.set('displayCount', this.get('displayCountInitial'));
  }.observes('params'),

  asPlayer: function() {
    var roleName = this.get('params.as') ||
      this.get('player.model.roleName');
    return this.get('trip.players')
      .findBy('roleName', roleName);
  }.property('params', 'player.roleName'),

  withPlayer: function() {
    var roleName = this.get('params.with');
    var withPlayer = this.get('trip.players')
      .findBy('roleName', roleName);
    if (!withPlayer) {
      return null;
    }
    return withPlayer;
  }.property('params', 'trip.players.length'),

  withName: function() {
    var withPlayer = this.get('withPlayer');
    if (!withPlayer) { return 'Unnamed'; }
    return withPlayer.get('contactName') ||
      withPlayer.get('firstName') ||
      withPlayer.get('role.title');
  }.property('withPlayer'),

  messages: function() {
    var asPlayer = this.get('asPlayer');
    var withPlayer = this.get('withPlayer');
    if (!asPlayer || !withPlayer) {
      return [];
    }
    var allMessages = this.get('trip.messages');
    var isIncomingOnly = false;
    return allMessages
      .filter(function(message) {
        var isOutgoing = (
          message.get('sentBy') === asPlayer &&
          message.get('sentTo') === withPlayer);
        var isIncoming = (
          message.get('sentBy') === withPlayer &&
          message.get('sentTo') === asPlayer);
        return isIncoming || (isOutgoing && !isIncomingOnly);
      })
      .sort(function(a, b) {
        return Ember.compare(
          a.get('createdAt').valueOf(),
          b.get('createdAt').valueOf());
      });
  }.property(
    'params', 'trip.messages.length',
    'trip.messages.@each.content'),

  numEarlierMessages: function() {
    var numMessages = this.get('messages.length');
    return Math.max(0, numMessages - this.get('displayCount'));
  }.property('params', 'messages.length', 'displayCount'),

  recentMessages: function() {
    var displayCount = this.get('displayCount');
    var messages = this.get('messages');
    return messages.slice(Math.max(0, messages.get('length') - displayCount));
  }.property('params', 'messages.length', 'displayCount',
    'messages.@each.content'),

  didInsertElement: function() {
    this._super();
    this.resetImageUpload();
  },

  willClearRender: function() {
    this.resetImageUpload(false);
  },

  placeholder: function() {
    var withName = this.get('withName');
    if (this.get('canSendTexts')) {
      return `Compose message to ${withName}`;
    }
    if (this.get('canSendImages')) {
      return `Can currently only send photos to ${withName}`;
    }
    return `Can't currently send messages to ${withName}`;
  }.property('withName', 'canSendTexts'),

  canSendTexts: function() {
    const roleTitle = this.get('withPlayer.role.title');
    const roleVar = fptCore.TextUtil.varForText(roleTitle);
    const hackValueName = `${roleVar}_can_receive_texts`;
    return this.get(`trip.values.${hackValueName}`) !== false;
  }.property('trip.values'),

  canSendImages: function() {
    const roleTitle = this.get('withPlayer.role.title');
    const roleVar = fptCore.TextUtil.varForText(roleTitle);
    const hackValueName = `${roleVar}_can_receive_images`;
    return this.get(`trip.values.${hackValueName}`) !== false;
  }.property('trip.values'),

  canInitiateCalls: function() {
    if (!this.get('callUrl')) {
      return false;
    }
    const roleTitle = this.get('withPlayer.role.title');
    const roleVar = fptCore.TextUtil.varForText(roleTitle);
    const hackValueName = `${roleVar}_can_receive_calls`;
    return this.get(`trip.values.${hackValueName}`) !== false;
  }.property('trip.values', 'callUrl'),

  canSend: function() {
    return true;
  }.property(),

  callUrl: function() {
    var profile = this.get('withPlayer.userProfile');
    if (!profile) {
      return;
    }
    if (profile.get('skypeUsername')) {
      return 'skype:' + profile.get('skypeUsername');
    }
    if (profile.get('facetimeUsername')) {
      return 'facetime-audio:' + profile.get('facetimeUsername');
    }
    if (profile.get('phoneNumber')) {
      return 'facetime-audio:' + profile.get('phoneNumber');
    }
    return '';
  }.property('withPlayer'),

  isSendTextDisabled: Ember.computed.not('canSendTexts'),
  isSendImageDisabled: Ember.computed.not('canSendImages'),

  resetImageUpload: function(recreate) {
    var fileInput = this.$('.image-upload-container input[type=file]');
    if (fileInput) {
      fileInput.off('change.image-upload');
    }
    if (recreate !== false) {
      this.$('.image-upload-container').html(
        '<input type="file" name="file" id="image-upload" accept="image/*"" capture="camera"/>');
      fileInput = this.$('.image-upload-container input[type=file]');
      fileInput.on('change.image-upload', this.imageDidChange.bind(this));
    }
  },

  processImage: function(file) {
    var IMAGE_MAX_WIDTH = 1500;
    var options = {
      maxWidth: IMAGE_MAX_WIDTH,
      canvas: true,
      orientation: true
    };
    return new Ember.RSVP.Promise(function(resolve, reject) {
      window.loadImage(file, function(resizedCanvas) {
        if (resizedCanvas.type === 'error') {
          reject("Error loading image for resizing.");
          return;
        }
        // Create jpeg
        resizedCanvas.toBlob(function(resizedBlob) {
          window.loadImage.parseMetaData(resizedBlob, function(data) {
            if (!data.imageHead) {
              reject("Error loading image headers.");
              return;
            }
            var blob = new Blob([
              data.imageHead,
              // Resized images always have a head size of 20 bytes,
              // including the JPEG marker and a minimal JFIF header:
              window.loadImage.blobSlice.call(resizedBlob, 20),
            ], {type: 'image/jpeg'});
            resolve(blob);
          });
        }, 'image/jpeg', 0.9);
      }, options);
    });
  },

  imageDidChange: function() {
    var fileInput = this.$('.image-upload-container input[type=file]')[0];
    var file = fileInput.files[0];
    if (!file) { return; }
    // Reset to make way for new upload
    this.resetImageUpload();

    // Send image.
    var env = this.get('environment.environmentName');
    var date = this.get('time.currentTime').format('YYYY-MM-DD');
    var ext = file.name.split('.').pop().toLowerCase();
    var key = env + '/uploads/' + date + '/' + guid() + '.' + ext;

    this.processImage(file)
      .then(function(blob) {
        this.uploadImage(blob, key);
      }.bind(this), function(err) {
        console.error(err.message);
      });
  },

  uploadImage: function(file, key) {
    var bucket = config.s3UploadParams.bucket;
    var url = `https://${bucket}.s3.amazonaws.com/${key}`;
    var self = this;
    var asRoleName = this.get('asPlayer.roleName');
    var toRoleName = this.get('withPlayer.roleName');
    this.set('isSendingMessage', true);
    this.get('sync').add(function() {
      return self.get('media').upload(file, key)
        .then(function() {
          self.triggerAction({
            action: 'sendImage',
            actionContext: [asRoleName, toRoleName, url]
          });          
        });
    });
  },

  queueDidChange: function() {
    if (this.get('isSendingMessage') &&
        this.get('sync.queue.length') === 0 &&
        !this.get('sync.inprogress')) {
      this.set('isSendingMessage', false);
    }
  }.observes('sync.queue.length', 'sync.inprogress').on('init'),

  messagesDidChange: function() {
    var scrollHeight = this.$().height();
    this.$().parents('.scrollable').scrollTop(scrollHeight);
  }.observes('messages'),

  actions: {
    sendText: function() {
      if (!this.get('messageInput')) { return; }
      if (this.get('messageInput') === '') { return; }
      var asRoleName = this.get('asPlayer.roleName');
      var toRoleName = this.get('withPlayer.roleName');
      // this.set('isSendingMessage', true);
      this.triggerAction({
        action: 'sendText',
        actionContext: [asRoleName, toRoleName, this.get('messageInput')]
      });
      this.set('messageInput', '');
    },
    showEarlier: function() {
      this.incrementProperty('displayCount', this.get('displayIncrease'));
    }
  }
});
