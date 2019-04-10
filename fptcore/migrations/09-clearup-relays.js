module.exports = {
  migrations: {
    relays: function(relay) {
      delete relay.admin_out;
      delete relay.phone_out;
      delete relay.phone_in;
      delete relay.phone_autoreply;
      delete relay.sms_out;
      delete relay.sms_in;
    },
  },
  tests: [{
    before: {
      relays: [{
        admin_out: true,
        phone_out: true,
        phone_in: false,
        phone_autoreply: 'abc',
        sms_out: true,
        sms_in: false
      }]
    },
    after: {
      relays: [{}]
    }
  }]
};
