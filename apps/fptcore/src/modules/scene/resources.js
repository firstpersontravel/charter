var scene = {
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    global: { type: 'boolean', default: false },
    if: { type: 'ifClause' }
  }
};

module.exports = {
  scene: scene
};
