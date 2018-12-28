var cue = {
  properties: {
    name: { type: 'name', required: true },
    scene: { type: 'reference', collection: 'scenes', required: true }
  }
};

module.exports = {
  cue: cue
};
