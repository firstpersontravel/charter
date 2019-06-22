module.exports = {
  resources: {
    trigger: {
      resource: require('./trigger'),
      actions: {
        conditional: require('./conditional')
      },
      conditions: require('./trigger_conditions')
    }
  }
};
