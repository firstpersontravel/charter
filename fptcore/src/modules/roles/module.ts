module.exports = {
  name: 'roles',
  resources: {
    role: {
      actions: {
        change_role: require('./role_change')
      },
      resource: require('./role'),
      conditions: require('./role_conditions')
    }
  }
};

export {};
