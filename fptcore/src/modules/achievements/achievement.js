var ACHIEVEMENT_STYLE_OPTIONS = ['completion', 'choice'];

module.exports = {
  icon: 'trophy',
  help: 'A description of one aspect of the trip outcome. A use is to easily summarize player choices and progress from an overview screen. For instance, you can quickly see which branches they experienced, how many areas were unlocked, or other metrics.',
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    scene: {
      type: 'reference',
      collection: 'scenes',
      required: true,
      help: 'The scene at which the outcome of this achievement is expected to be known. Before this scene, the achivement will be listed as \'pending\'.'
    },
    style: {
      type: 'enum',
      options: ACHIEVEMENT_STYLE_OPTIONS,
      default: 'completion',
      required: true,
      help: '"Completion" achievements are active if the test resolves to true. "Choice" achievements can have multiple titles based on the evaluation of the test.'
    },
    test: {
      type: 'component',
      component: 'conditions',
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
