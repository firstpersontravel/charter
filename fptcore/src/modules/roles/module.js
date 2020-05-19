module.exports = {
  name: 'roles',
  resources: {
    role: {
      resource: require('./role'),
      conditions: require('./role_conditions')
    }
  }
};
