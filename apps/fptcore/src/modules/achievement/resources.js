var ACHIEVEMENT_STYLE_OPTIONS = ['completion', 'choice'];

var achievement = {
  help: {
    summary: 'An achievement is a defined summary of trip state. A use is to easily summarize player choices and progress from an overview screen. For instance, you can quickly see which branches they experienced, how many areas were unlocked, or other metrics.',
  },
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    scene: { type: 'reference', collection: 'scenes', required: true },
    style: {
      type: 'enum',
      options: ACHIEVEMENT_STYLE_OPTIONS,
      default: 'completion',
      required: true
    },
    test: { type: 'ifClause', required: true },
    titles: {
      type: 'dictionary',
      required: true,
      default: { 'true': '', 'false': '' },
      keys: { type: 'string' },
      values: { type: 'string' }
    },
  }
};

module.exports = {
  achievement: achievement
};
