module.exports = {
  name: 'email',
  resources: {
    email: {
      resource: null,
      actions: {
        send_email: require('./email_send')
      }
    },
    inbox: {
      resource: require('./inbox')
    }
  }
};

export {};
