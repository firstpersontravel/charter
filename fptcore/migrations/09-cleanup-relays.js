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
    roles: function(role) {
      if (role.user) {
        role.type = role.actor ? 'performer' : 'traveler';
      } else {
        role.type = 'scripted';
      }
      delete role.user;
      delete role.actor;
      delete role.primary;
    }
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
      }],
      roles: [{
        user: true,
        actor: false,
        primary: true
      }, {
        user: true,
        actor: true,
        primary: false
      }, {
        user: false,
        actor: false,
        primary: false
      }]
    },
    after: {
      relays: [{}],
      roles: [
        { type: 'traveler' },
        { type: 'performer' },
        { type: 'scripted' }
      ]
    }
  }]
};
