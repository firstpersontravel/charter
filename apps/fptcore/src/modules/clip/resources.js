var QUERY_TYPE_VALUES = ['normal'];
var CLIP_VOICE_VALUES = ['alice', 'man', 'woman'];

var clipQuery = {
  properties: {
    name: { type: 'name' },
    type: { type: 'enum', values: QUERY_TYPE_VALUES, default: 'normal' },
    hints: { type: 'list', items: { type: 'string' } }
  }
};

var clip = {
  properties: {
    name: { type: 'name', required: true },
    transcript: { type: 'string' },
    voice: { type: 'enum', values: CLIP_VOICE_VALUES, default: 'alice' },
    path: { type: 'media', extensions: ['m4a', 'mp3'] },
    query: { type: 'subresource', class: clipQuery }
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
