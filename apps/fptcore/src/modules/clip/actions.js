var _ = require('lodash');

var EvalCore = require('../../cores/eval');

var play_clip = {
  phraseForm: ['clip_name'],
  requiredEventTypes: [
    'call_received', // type: call_received, from: role
    'call_answered', // type: call_answered, to: role
    'query_responded', // type: query_responded, clip: clip-name
  ],
  params: {
    clip_name: { required: true, type: 'reference', collection: 'clips' }
  },
  applyAction: function (params, actionContext) {
    // Find the clip.
    var clip = _.find(actionContext.scriptContent.clips,
      { name: params.clip_name });
    if (!clip) {
      return null;
    }
    // Play audio if it is present.
    var playClause = clip.path ?
      { clause: 'play', media: clip.path } :
      {
        clause: 'say',
        voice: clip.voice || 'alice',
        message: EvalCore.templateText(actionContext.evalContext,
          clip.transcript, actionContext.timezone)
      };

    // If we expect a response, return the play within a gather
    // clause.
    if (clip.query) {
      return [{
        operation: 'twiml',
        clause: 'gather',
        queryName: clip.query.name,
        queryType: clip.query.type || 'normal',
        queryHints: clip.query.hints || null,
        subclause: playClause
      }];
    }

    // Otherwise just return the play/say clause.
    return [
      Object.assign({operation: 'twiml'}, playClause)
    ];
  }
};

module.exports = {
  play_clip: play_clip
};
