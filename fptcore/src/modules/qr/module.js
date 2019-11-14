module.exports = {
  name: 'qr_code',
  resources: {
    qr_code: {
      resource: require('./qr_code'),
      panels: {
        qr_display: require('./qr_display')
      }
    }
  }
};
