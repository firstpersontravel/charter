module.exports = {
  name: 'roles',
  resources: {
    role: {
      actions: {
        switch_role: require('./role_switch')
      },
      resource: require('./role'),
      conditions: require('./role_conditions')
    }
  }
};
