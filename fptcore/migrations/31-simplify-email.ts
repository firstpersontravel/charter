module.exports = {
  migrations: {
    actions: function(action) {
      if (action.name === 'send_email') {
        delete action.cc;
        delete action.bcc;
      }
    },
    inboxes: function(inbox) {
      inbox.address = 'charter@firstperson.travel';
    }
  },
  tests: [{
    before: {
      triggers: [{
        actions: [{
          name: 'send_email',
          cc: 'gabe@gabe.com',
          bcc: 'gabe@gabe.com'
        }]
      }],
      inboxes: [{
        address: 'dispatch@tacosyndicate.family'
      }]
    },
    after: {
      triggers: [{
        actions: [{
          name: 'send_email'
        }]
      }],
      inboxes: [{
        address: 'charter@firstperson.travel'
      }]
    }
  }]
};
