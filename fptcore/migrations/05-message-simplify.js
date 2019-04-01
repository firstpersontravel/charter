module.exports = {
  // Do nothing. This is a no-op migration to add the version string.
  migrations: {
    actions: function(action) {
      if (action.name === 'custom_message') {
        action.medium = action.message_medium;
        delete action.message_medium;
        action.content = action.message_content;
        delete action.message_content;
        action.latitude = action.location_latitude;
        delete action.location_latitude;
        action.longitude = action.location_longitude;
        delete action.location_longitude;
        action.accuracy = action.location_accuracy;
        delete action.location_accuracy;
        action.from_relay_id = action.suppress_relay_id;
        delete action.suppress_relay_id;
      }
    }
  },
  tests: [{
    before: {
      triggers: [{
        actions: [{
          name: 'custom_message',
          message_medium: 'text',
          message_content: 'hi there',
          location_latitude: 12,
          location_longitude: 34,
          location_accuracy: 56,
          suppress_relay_id: null
        }]
      }]
    },
    after: {
      triggers: [{
        actions: [{
          name: 'custom_message',
          medium: 'text',
          content: 'hi there',
          latitude: 12,
          longitude: 34,
          accuracy: 56,
          from_relay_id: null
        }]
      }]
    }
  }]
};
