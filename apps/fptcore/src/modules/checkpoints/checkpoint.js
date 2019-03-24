module.exports = {
  help: {
    summary: 'A checkpoint is a saved place marker in a trip that can be quickly reset to for testing purposes.'
  },
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    scene: { type: 'reference', collection: 'scenes', required: true },
    pages: {
      type: 'dictionary',
      keys: { type: 'reference', collection: 'roles' },
      values: { type: 'reference', collection: 'pages', allowNull: true }
    },
    values: {
      type: 'dictionary',
      keys: { type: 'name', },
      values: { type: 'simpleValue' }
    }
  }
};
