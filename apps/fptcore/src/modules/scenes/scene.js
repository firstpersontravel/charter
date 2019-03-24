module.exports = {
  help: {
    summary: 'A scene is a temporal unit of experience. Usually only one scene is active at a time.'
  },
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    global: { type: 'boolean', default: false },
    if: { type: 'ifClause' }
  }
};
