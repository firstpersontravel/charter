const _ = require('lodash');

module.exports = {
  migrations: {
    eventSpecs: function(eventSpec, scriptContent) {
      if (eventSpec.type === 'query_responded') {
        const clip = _.find(scriptContent.clips, clip => (
          _.get(clip, 'query.name') === eventSpec.query
        ));
        eventSpec.type = 'clip_answered';
        eventSpec.clip = clip ? clip.name : '<error>';
        delete eventSpec.query;
        delete eventSpec.partial;
        delete eventSpec.final;
      }
    },
    clips: function(clip) {
      if (clip.query) {
        clip.answer_expected = true;
        clip.answer_hints = clip.query.hints;
      }
      delete clip.query;
    }
  },
  tests: [{
    before: {
      clips: [{
        name: 'CLIP-1',
        query: {
          name: 'abc',
          hints: ['d', 'e', 'f']
        }
      }, {
        name: 'CLIP-2'
      }],
      triggers: [{
        events: [{ type: 'query_responded', query: 'abc', partial: true }]
      }]
    },
    after: {
      clips: [{
        name: 'CLIP-1',
        answer_expected: true,
        answer_hints: ['d', 'e', 'f']
      }, {
        name: 'CLIP-2'
      }],
      triggers: [{
        events: [{ type: 'clip_answered', clip: 'CLIP-1' }]
      }]
    }
  }]
};
