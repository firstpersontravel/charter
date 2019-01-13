var role = {
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    actor: { type: 'boolean', default: false },
    user: { type: 'boolean', default: false },
    if: { type: 'ifClause' },
    starting_page: { type: 'reference', collection: 'pages' },
    required_values: {
      type: 'list',
      items: { type: 'simpleAttribute', required: true }
    },
    default_layout: { type: 'reference', collection: 'layouts' },
    primary: { type: 'boolean', default: false }
  }
};

module.exports = {
  role: role
};
