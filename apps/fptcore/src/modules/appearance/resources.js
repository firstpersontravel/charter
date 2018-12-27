var appearance = {
  properties: {
    name: { type: 'name', required: true },
    role: { type: 'resource', collection: 'roles', required: true },
    title: { type: 'string', required: true },
    intro: { type: 'string' },
    disabled_message: { type: 'string' },
    start: { type: 'resource', collection: 'times' },
    if: { type: 'if' }
  }
};

module.exports = {
  appearance: appearance
};
