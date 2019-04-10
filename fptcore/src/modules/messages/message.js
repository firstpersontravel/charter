var MESSAGE_MEDIUM_OPTIONS = ['text', 'image', 'audio'];

module.exports = {
  icon: 'comment',
  help: 'Text or media that can be sent from one player to another.',
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    scene: { type: 'reference', collection: 'scenes', required: true },
    medium: {
      type: 'enum',
      options: MESSAGE_MEDIUM_OPTIONS,
      required: true,
      help: 'What kind of message this is.'
    },
    from: {
      type: 'reference',
      collection: 'roles',
      required: true,
      help: 'The sender of the message.'
    },
    to: {
      type: 'reference',
      collection: 'roles',
      help: 'The recipient of the message.'
    },
    content: {
      type: 'string',
      required: true,
      help: 'For text messages, the content. For audio or image, the path.'
    },
    read: { type: 'boolean', default: false, display: { hidden: true } }
  }
};
