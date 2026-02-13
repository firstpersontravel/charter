export default {
  name: 'email',
  resources: {
    email: {
      resource: null,
      actions: {
        send_email: require('./email_send').default
      }
    },
    inbox: {
      resource: require('./inbox').default
    }
  }
};

