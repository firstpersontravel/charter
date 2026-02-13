export default {
  name: 'triggers',
  resources: {
    trigger: {
      resource: require('./trigger').default,
      actions: {
        conditional: require('./conditional').default
      },
      conditions: require('./trigger_conditions').default
    }
  }
};

