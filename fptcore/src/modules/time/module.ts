module.exports = {
  name: 'time',
  resources: {
    time: {
      resource: require('./time'),
      actions: {
        wait: require('./wait'),
        wait_before_time: require('./wait_before_time'),
        wait_for_time: require('./wait_for_time')
      },
      events: {
        time_occurred: require('./time_occurred')
      }
    }
  }
};

export {};
