module.exports = {
  name: 'messages',
  resources: {
    text: {
      resource: null,
      actions: {
        send_text: require('./text_send')
      },
      events: {
        text_received: require('./text_received')
      }
    },
    image: {
      resource: null,
      actions: {
        send_image: require('./image_send')
      },
      events: {
        image_received: require('./image_received')
      }
    },
    audio: {
      resource: null,
      actions: {
        send_audio: require('./audio_send')
      },
      events: {
        audio_received: require('./audio_received')
      }
    }
  }
};
