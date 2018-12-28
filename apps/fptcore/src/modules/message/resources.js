var MESSAGE_TYPE_OPTIONS = ['text', 'image', 'audio'];

var message = {
  properties: {
    name: { type: 'name', required: true },
    scene: { type: 'reference', collection: 'scenes', required: true },
    type: { type: 'enum', options: MESSAGE_TYPE_OPTIONS, required: true },
    from: { type: 'reference', collection: 'roles', required: true },
    to: { type: 'reference', collection: 'roles' },
    content: { type: 'string', required: true },
    read: { type: 'boolean', default: false }
  }
};

module.exports = {
  message: message
};
