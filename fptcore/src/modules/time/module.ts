export default {
  name: 'time',
  resources: {
    time: {
      resource: require('./time').default,
      actions: {
        wait: require('./wait').default,
        wait_before_time: require('./wait_before_time').default,
        wait_for_time: require('./wait_for_time').default
      },
      events: {
        time_occurred: require('./time_occurred').default
      }
    }
  }
};

