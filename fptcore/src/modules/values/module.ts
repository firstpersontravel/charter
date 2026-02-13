export default {
  name: 'values',
  resources: {
    value: {
      resource: null,  // implicit
      actions: {
        set_value: require('./value_set').default,
        increment_value: require('./value_increment').default
      },
      conditions: require('./value_conditions').default
    }
  }
};

