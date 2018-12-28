var SubresourcesRegistry = require('../../registries/subresources');

var CLIP_VOICE_VALUES = ['alice', 'man', 'woman'];

var clip = {
  properties: {
    name: { type: 'name', required: true },
    transcript: { type: 'string' },
    voice: { type: 'enum', values: CLIP_VOICE_VALUES, default: 'alice' },
    path: { type: 'media', extensions: ['m4a', 'mp3'] },
    query: { type: 'subresource', class: SubresourcesRegistry.query }
  },
  validateResource: function(script, resource) {
    if (!resource.transcript && !resource.path) {
      return ['Clip resource requires either a transcript or a media path.'];
    }
  }
};

module.exports = {
  clip: clip
};
