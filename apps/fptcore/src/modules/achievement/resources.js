var ACHIEVEMENT_STYLE_VALUES = ['completion', 'choice'];

var achievement = {
  properties: {
    name: { type: 'name', required: true },
    scene: { type: 'reference', collection: 'scenes', required: true },
    style: { type: 'enum', values: ACHIEVEMENT_STYLE_VALUES, required: true },
    test: { type: 'ifClause', required: true },
    titles: {
      type: 'dictionary',
      required: true,
      keys: { type: 'string' },
      values: { type: 'string' }
    },
  }
};

module.exports = {
  achievement: achievement
};
