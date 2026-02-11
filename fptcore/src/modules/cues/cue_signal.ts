import { find } from '../../utils/lodash-replacements';
import type { ActionContext } from '../../types';

module.exports = {
  help: 'Signal a cue. A cue does nothing on its own, but usually will have triggers attached, which fire actions.',
  params: {
    cue_name: {
      required: true,
      type: 'reference',
      collection: 'cues',
      display: { label: false },
      help: 'The cue to signal.'
    }
  },
  getOps(params: Record<string, any>, actionContext: ActionContext) {
    var cue = find(actionContext.scriptContent.cues,
      { name: params.cue_name });
    if (!cue) {
      return [{
        operation: 'log',
        level: 'error',
        message: 'Could not find cue named "' + params.cue_name + '".'
      }];
    }
    return [{
      operation: 'event',
      event: { type: 'cue_signaled', cue: params.cue_name }
    }];
  }
};
