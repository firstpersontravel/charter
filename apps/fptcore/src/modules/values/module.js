module.exports = {
  resources: {
    value: {
      resource: null,  // implicit
      actions: {
        set_value: require('./value_set'),
        increment_value: require('./value_increment')
      }
    }
  }
};
