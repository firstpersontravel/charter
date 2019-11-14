module.exports = {
  name: 'triggers',
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
