var CLIP_VOICE_OPTIONS = ['alice', 'man', 'woman'];

module.exports = {
  title: 'Call clip',
  icon: 'volume-control-phone',
  help: 'A snippet of audio that can be played as part of phone calls.',
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    scene: {
      type: 'reference',
      collection: 'scenes',
      required: true,
      help: 'The scene at which this clip will be played.'
    },
    transcript: {
      type: 'string',
      help: 'The text transcript used to generate audio via speech-to-text. Only required if there is not a media path.',
      display: { multiline: true }
    },
    voice: {
      type: 'enum',
      options: CLIP_VOICE_OPTIONS,
      default: 'alice',
      help: 'The voice used to generate audio via speech-to-text. Only required if there is not a media path.'
    },
    path: {
      type: 'media',
      medium: 'audio',
      help: 'Media to play.'
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
