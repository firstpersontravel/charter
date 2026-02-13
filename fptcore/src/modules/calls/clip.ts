var CLIP_VOICE_OPTIONS = [
  'alice',
  'man',
  'woman',
  'Google.en-US-Chirp3-HD-Aoede',
  'Google.en-US-Chirp3-HD-Charon',
  'Google.en-US-Chirp3-HD-Fenrir',
  'Google.en-US-Chirp3-HD-Kore',
  'Google.en-US-Chirp3-HD-Leda',
  'Google.en-US-Chirp3-HD-Orus',
  'Google.en-US-Chirp3-HD-Puck',
  'Google.en-US-Chirp3-HD-Zephyr',
  'Polly.Danielle-Generative',
  'Polly.Joanna-Generative',
  'Polly.Matthew-Generative',
  'Polly.Ruth-Generative',
  'Polly.Stephen-Generative',
];

export default {
  title: 'Call clip',
  icon: 'phone',
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
      default: 'Google.en-US-Chirp3-HD-Aoede',
      help: 'The voice used to generate audio via speech-to-text. Only required if there is not a media path.'
    },
    audio: {
      type: 'media',
      medium: 'audio',
      help: 'The audio clip to play.'
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
  }
};

