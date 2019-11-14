module.exports = {
  icon: 'qrcode',
  help: 'Displays a QR Code.',
  properties: {
    qr_code: {
      type: 'reference',
      collection: 'qr_codes',
      required: true
    }
  }
};
