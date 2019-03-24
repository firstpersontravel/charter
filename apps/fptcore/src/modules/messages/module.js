module.exports = {
  resources: {
    message: {
      resource: require('./message'),
      actions: {
        custom_message: require('./message_custom'),
        send_message: require('./message_send')
      },
      events: {
        // This should maybe be message_received?
        message_sent: require('./message_sent')
      }
    }
  }
};
