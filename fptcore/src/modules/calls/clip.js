var CLIP_VOICE_OPTIONS = ['alice', 'man', 'woman'];

module.exports = {
  icon: 'volume-control-phone',
  help: 'A unit of text or audio that can be played as part of phone calls. A clip can expect an answer, which will fire a `clip_answered` event when it comes in.',
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
    answer_expected: {
      type: 'boolean',
      help: 'Is an answer expected for this clip?'
    },
    answer_hints: {
      type: 'list',
      items: { type: 'string', help: 'An option for the voice answer.' },
      help: 'List of suggestions for decoding the voice of the answer.'
    }
  },
  validateResource: function(script, resource) {
    if (!resource.transcript && !resource.path) {
      return ['Clip resource requires either a transcript or a media path.'];
    }
  }
};
