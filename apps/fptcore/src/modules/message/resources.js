var MESSAGE_TYPE_VALUES = ['text', 'image', 'audio'];

var message = {
  properties: {
    name: { type: 'name', required: true },
    scene: { type: 'reference', collection: 'scenes', required: true },
    type: { type: 'enum', values: MESSAGE_TYPE_VALUES, required: true },
    from: { type: 'reference', collection: 'roles', required: true },
    to: { type: 'reference', collection: 'roles' },
    content: { type: 'string', required: true },
    read: { type: 'boolean', default: false }
  }
};

module.exports = {
  message: message
};
