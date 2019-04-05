module.exports = {
  name: 'messages',
  resources: {
    message: {
      resource: require('./message'),
      actions: {
        custom_message: require('./message_custom'),
        send_message: require('./message_send')
      },
      events: {
        message_received: require('./message_received')
      }
    }
  }
};
