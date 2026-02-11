import { find } from '../../utils/lodash-replacements';
import type { ActionContext, Event, ScriptContent } from '../../types';

module.exports = {
  help: 'Occurs when a player responds to a clip over the phone.',
  title: 'Call clip answered',
  parentCollectionName: 'clips',
  parentCollectionSpecProperty: 'clip',
  specParams: {
    clip: {
      required: true,
      type: 'reference',
      collection: 'clips',
      hint: 'The clip being responded to.'
    },
    allow_partial: {
      type: 'boolean',
      hint: 'Allow partial responses.',
      display: { hidden: true }
    }
  },
  eventParams: {
    clip: {
      required: true,
      type: 'reference',
      collection: 'clips',
      hint: 'The clip being responded to.'
    },
    response: {
      required: true,
      type: 'string',
      hint: 'Content of the response'
    },
    partial: {
      type: 'boolean',
      hint: 'Is the response partial.'
    }
  },
  matchEvent: function(spec: Record<string, any>, event: Event, actionContext: ActionContext) {
    if (event.partial && !spec.allow_partial) {
      return false;
    }
    return spec.clip === event.clip;
  },
  getTitle: function(scriptContent: ScriptContent, spec: Record<string, any>) {
    if (spec.clip) {
      var clip = find(scriptContent.clips, { name: spec.clip });
      return `${clip.title} answered`;
    }
    return 'clip answered';
  }
};
