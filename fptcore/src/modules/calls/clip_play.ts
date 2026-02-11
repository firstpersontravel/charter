import { find } from '../../utils/lodash-replacements';

const TemplateUtil = require('../../utils/template');
import type { ActionContext } from '../../types';

module.exports = {
  title: 'Play call clip',
  help: 'Play a call clip on an active phone call.',
  params: {
    clip_name: {
      required: true,
      type: 'reference',
      collection: 'clips',
      help: 'The clip to play.'
    }
  },
  getOps(params: Record<string, any>, actionContext: ActionContext) {
    // Find the clip.
    const clip = find(actionContext.scriptContent.clips, { name: params.clip_name });
    if (!clip) {
      return [{
        operation: 'log',
        level: 'error',
        message: 'Could not find clip named "' + params.clip_name + '".'
      }];
    }

    // Play audio if it is present.
    let playClause;
    if (clip.audio) {
      playClause = { clause: 'play', media: clip.audio };
    } else if (clip.transcript) {
      const transcript = TemplateUtil.templateText(actionContext.evalContext,
        clip.transcript, actionContext.timezone);
      playClause = {
        clause: 'say',
        voice: clip.voice || 'alice',
        message: transcript
      };
    } else {
      return [{
        operation: 'log',
        level: 'warn',
        message: 'No transcript or audio for clip.'
      }];
    }

    // If we expect a response, return the play within a gather
    // clause.
    if (clip.answer_expected) {
      return [{
        operation: 'twiml',
        clause: 'gather',
        clipName: clip.name,
        hints: clip.answer_hints || null,
        subclause: playClause
      }];
    }

    // Otherwise just return the play/say clause.
    return [Object.assign({operation: 'twiml'}, playClause)];
  }
};
