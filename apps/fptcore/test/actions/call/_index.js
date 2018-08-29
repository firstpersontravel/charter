describe('Call', () => {
  require('fs').readdirSync(__dirname + '/')
    .forEach(function(file) {
      if (file.match(/\.js$/) !== null && file !== 'index.js') {
        exports[file.replace('.js', '')] = require('./' + file);
      }
    });
});
