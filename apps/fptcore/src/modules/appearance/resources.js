var appearance = {
  properties: {
    name: { type: 'name', required: true },
    role: { type: 'reference', collection: 'roles', required: true },
    title: { type: 'string', required: true },
    intro: { type: 'string' },
    disabled_message: { type: 'string' },
    start: { type: 'reference', collection: 'times' },
    if: { type: 'ifClause' }
  }
};

module.exports = {
  appearance: appearance
};
