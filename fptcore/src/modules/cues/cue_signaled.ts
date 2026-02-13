import { find } from '../../utils/lodash-replacements';
import type { ActionContext, Event, ScriptContent } from '../../types';

export default {
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
  matchEvent: function(spec: Record<string, any>, event: Event, actionContext: ActionContext) {
    return spec.cue === event.cue;
  },
  getTitle: function(scriptContent: ScriptContent, resource: Record<string, any>, registry: any) {
    var cue = find(scriptContent.cues, { name: resource.cue });
    return `cue "${cue ? cue.title : 'unknown'}"`;
  }
};
