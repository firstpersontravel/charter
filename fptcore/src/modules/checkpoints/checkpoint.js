module.exports = {
  icon: 'floppy-o',
  help: 'A saved place marker for quickly resetting a trip while testing.',
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    scene: { type: 'reference', collection: 'scenes', required: true },
    pages: {
      type: 'dictionary',
      keys: { type: 'reference', collection: 'roles' },
      values: { type: 'reference', collection: 'pages', allowNull: true },
      help: 'Pages to start each role at.'
    },
    values: {
      type: 'dictionary',
      keys: { type: 'name', },
      values: { type: 'simpleValue' },
      help: 'Values to pre-set.'
    }
  }
};
