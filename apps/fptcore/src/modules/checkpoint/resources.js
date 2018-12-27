var checkpoint = {
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    scene: { type: 'resource', collection: 'scenes', required: true },
    pages: {
      type: 'dictionary',
      keys: { type: 'resource', collection: 'roles' },
      values: { type: 'resource', collection: 'pages' }
    },
    values: {
      type: 'dictionary',
      keys: { type: 'name', },
      values: { type: 'simple' }
    }
  }
};

module.exports = {
  checkpoint: checkpoint
};
