module.exports = {
  icon: 'qrcode',
  help: 'A QR code that can be scanned elsewhere.',
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    page: {
      type: 'reference',
      collection: 'pages',
      help: 'The page that this QR code will direct you to after scanning.'
    },
    cue: {
      type: 'reference',
      collection: 'cues',
      help: 'The cue that this QR code will signal if scanned. This cue will only fire if its scene and trip are currently active.'
    }
  }
};
