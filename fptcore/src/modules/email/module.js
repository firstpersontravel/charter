module.exports = {
  name: 'email',
  resources: {
    email: {
      resource: require('./email'),
      actions: {
        send_email: require('./email_send')
      }
    },
    inbox: {
      resource: require('./inbox')
    }
  }
};
