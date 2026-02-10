import { find } from '../../utils/lodash-replacements';

module.exports = {
  help: 'Occurs when a cue has been signaled.',
  parentCollectionName: 'cues',
  parentCollectionSpecProperty: 'cue',
  specParams: {
    cue: {
      required: true,
      type: 'reference',
      collection: 'cues',
      display: { label: false },
      help: 'The cue that was signaled.'
    }
  },
  matchEvent: function(spec: any, event: any, actionContext: any) {
    return spec.cue === event.cue;
  },
  getTitle: function(scriptContent, resource, registry) {
    var cue = find(scriptContent.cues, { name: resource.cue });
    return `cue "${cue ? cue.title : 'unknown'}"`;
  }
};
