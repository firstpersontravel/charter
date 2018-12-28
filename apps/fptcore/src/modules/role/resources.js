var role = {
  properties: {
    name: { type: 'name', required: true },
    contact_name: { type: 'string' },
    actor: { type: 'boolean', default: false },
    user: { type: 'boolean', default: false },
    if: { type: 'ifClause' },
    starting_page: { type: 'reference', collection: 'pages' },
    required_values: { type: 'list', items: { type: 'simpleAttribute' } },
    default_layout: { type: 'reference', collection: 'layouts' },
    primary: { type: 'boolean', default: false },
    minor: { type: 'boolean', default: false }
  }
};

module.exports = {
  role: role
};
