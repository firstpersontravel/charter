var ACHIEVEMENT_STYLE_OPTIONS = ['completion', 'choice'];

module.exports = {
  icon: 'trophy',
  help: 'An achievement is a defined summary of trip state. A use is to easily summarize player choices and progress from an overview screen. For instance, you can quickly see which branches they experienced, how many areas were unlocked, or other metrics.',
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    scene: { type: 'reference', collection: 'scenes', required: true },
    style: {
      type: 'enum',
      options: ACHIEVEMENT_STYLE_OPTIONS,
      default: 'completion',
      required: true,
      help: '"Completion" achievements are active if the test resolves to true. "Choice" achievements can have multiple titles based on the evaluation of the test.'
    },
    test: {
      type: 'ifClause',
      required: true,
      help: 'The value to test for to determine if this achievement has been activated.'
    },
    titles: {
      type: 'dictionary',
      required: true,
      default: { 'true': '', 'false': '' },
      keys: { type: 'string' },
      values: { type: 'string' },
      help: 'Text values to display based on the result of the achievement test.'
    },
  }
};
