var cue = {
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    scene: { type: 'reference', collection: 'scenes', required: true }
  }
};

module.exports = {
  cue: cue
};
