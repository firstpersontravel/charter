module.exports = {
  name: 'values',
  resources: {
    value: {
      resource: null,  // implicit
      actions: {
        set_value: require('./value_set'),
        increment_value: require('./value_increment')
      },
      conditions: require('./value_conditions')
    }
  }
};
