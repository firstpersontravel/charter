var departure = {
  help: {
    summary: 'A departure is a label used to differentiate trips taking place simultaneously.'
  },
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true }
  }
};

module.exports = {
  departure: departure
};
