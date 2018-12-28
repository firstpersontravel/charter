var QUERY_TYPE_VALUES = ['normal'];

var query = {
  properties: {
    name: { type: 'name' },
    type: { type: 'enum', values: QUERY_TYPE_VALUES, default: 'normal' },
    hints: { type: 'list', items: { type: 'string' } }
  }
};

module.exports = {
  query: query
};
