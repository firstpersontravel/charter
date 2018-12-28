var QUERY_TYPE_OPTIONS = ['normal'];

var query = {
  properties: {
    name: { type: 'name' },
    type: { type: 'enum', options: QUERY_TYPE_OPTIONS, default: 'normal' },
    hints: { type: 'list', items: { type: 'string' } }
  }
};

module.exports = {
  query: query
};
