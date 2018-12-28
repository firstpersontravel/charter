var time = {
  properties: {
    name: { type: 'name', required: true },
    scene: { type: 'reference', collection: 'scenes', required: true }
  }
};

module.exports = {
  time: time
};
