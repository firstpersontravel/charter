var _ = require('lodash');

var EvalCore = require('../../eval');

var play_clip = {
  phraseForm: ['clip_name'],
  requiredContext: [
    'call_received', // type: call_received, from: role
    'call_answered', // type: call_answered, to: role
    'query_responded', // type: query_responded, clip: clip-name
  ],
  params: {
    clip_name: { required: true, type: 'resource', collection: 'clips' }
  },
  applyAction: function (script, context, params, applyAt) {
    // Find the clip.
    var clip = _.find(script.content.clips, { name: params.clip_name });
    if (!clip) {
      return null;
    }
    // Play audio if it is present.
    var playClause = clip.audio ?
      { clause: 'play', media: clip.audio } :
      {
        clause: 'say',
        voice: clip.voice || 'alice',
        message: EvalCore.templateText(context, clip.transcript, script.timezone)
      };

    // If we expect a response, return the play within a gather
    // clause.
    if (clip.query) {
      return [{
        operation: 'twiml',
        clause: 'gather',
        queryName: clip.query,
        queryType: clip.query_type || 'normal',
        queryHints: clip.query_hints || null,
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
