var query = require('./query');

var CLIP_VOICE_OPTIONS = ['alice', 'man', 'woman'];

module.exports = {
  icon: 'volume-control-phone',
  help: 'A unit of text or audio that can be played as part of phone calls. A clip will optionally include a query, in which case the call participant\'s response will be recorded and resent as a `query_responded` event.',
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    scene: { type: 'reference', collection: 'scenes', required: true },
    transcript: { type: 'string' },
    voice: { type: 'enum', options: CLIP_VOICE_OPTIONS, default: 'alice' },
    path: { type: 'media', extensions: ['m4a', 'mp3'] },
    query: { type: 'subresource', class: query }
  },
  validateResource: function(script, resource) {
    if (!resource.transcript && !resource.path) {
      return ['Clip resource requires either a transcript or a media path.'];
    }
  }
};
