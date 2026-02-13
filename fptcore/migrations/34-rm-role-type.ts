export default {
  migrations: {
    roles: function(role) {
      delete role.type;
      delete role.active_if;
      if (role.required_values) {
        role.role_values = role.required_values;
        delete role.required_values;
      }
    }
  },
  tests: [{
    before: {
      roles: [{
        type: 'traveler',
        active_if: { op: 'none' }
      }, {
        type: 'traveler',
        required_values: ['abc']
      }]
    },
    after: {
      roles: [{
      }, {
        role_values: ['abc']
      }]
    }
  }]
};
