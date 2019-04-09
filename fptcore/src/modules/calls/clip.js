var query = require('./query');

var CLIP_VOICE_OPTIONS = ['alice', 'man', 'woman'];

module.exports = {
  icon: 'volume-control-phone',
  help: 'A unit of text or audio that can be played as part of phone calls. A clip will optionally include a query, in which case the call participant\'s response will be recorded and resent as a `query_responded` event.',
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    scene: { type: 'reference', collection: 'scenes', required: true },
    transcript: {
      type: 'string',
      help: 'The text transcript used to generate audio via speech-to-text. Only required if there is not a media path.'
    },
    voice: {
      type: 'enum',
      options: CLIP_VOICE_OPTIONS,
      default: 'alice',
      help: 'The voice used to generate audio via speech-to-text. Only required if there is not a media path.'
    },
    path: {
      type: 'media',
      extensions: ['m4a', 'mp3'],
      help: 'Media path for an audio clip to play.'
    },
    query: {
      type: 'subresource',
      name: 'query',
      class: query
    }
  },
  validateResource: function(script, resource) {
    if (!resource.transcript && !resource.path) {
      return ['Clip resource requires either a transcript or a media path.'];
    }
  }
};
