export default {
  name: 'messages',
  resources: {
    text: {
      resource: null,
      actions: {
        send_text: require('./text_send').default
      },
      events: {
        text_received: require('./text_received').default
      },
      conditions: require('./text_conditions').default
    },
    image: {
      resource: null,
      actions: {
        send_image: require('./image_send').default
      },
      events: {
        image_received: require('./image_received').default
      }
    },
    audio: {
      resource: null,
      actions: {
        send_audio: require('./audio_send').default
      },
      events: {
        audio_received: require('./audio_received').default
      }
    }
  }
};

