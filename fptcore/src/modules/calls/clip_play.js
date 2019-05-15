const _ = require('lodash');

const TemplateUtil = require('../../utils/template');

module.exports = {
  help: 'Play a clip on an active phone call.',
  requiredEventTypes: [
    'call_received', // type: call_received, from: role
    'call_answered', // type: call_answered, to: role
    'clip_answered', // type: clip_answered, clip: clip-name
  ],
  params: {
    clip_name: {
      required: true,
      type: 'reference',
      collection: 'clips',
      help: 'The clip to play.'
    }
  },
  applyAction: function (params, actionContext) {
    // Find the clip.
    const clip = _.find(actionContext.scriptContent.clips,
      { name: params.clip_name });
    if (!clip) {
      return [{
        operation: 'log',
        level: 'error',
        message: 'Could not find clip named "' + params.clip_name + '".'
      }];
    }

    // Play audio if it is present.
    const playClause = clip.path ?
      { clause: 'play', media: clip.path } :
      {
        clause: 'say',
        voice: clip.voice || 'alice',
        message: TemplateUtil.templateText(actionContext.evalContext,
          clip.transcript, actionContext.timezone)
      };

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
