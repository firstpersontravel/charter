export default {
  name: 'roles',
  resources: {
    role: {
      actions: {
        change_role: require('./role_change').default
      },
      resource: require('./role').default,
      conditions: require('./role_conditions').default
    }
  }
};

