module.exports = {
  resources: {
    departure: {
      resource: require('./departure')
    },
    time: {
      resource: require('./time'),
      events: {
        time_occurred: require('./time_occurred')
      }
    },
    variant: {
      resource: require('./variant')
    }
  }
};
