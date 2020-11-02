const _ = require('lodash');
const fs = require('fs');

fs.readdirSync(`${__dirname}/`).forEach(function(file) {
  const subdir = `${__dirname}/${file}/`;
  if (!fs.existsSync(subdir) || !fs.lstatSync(subdir).isDirectory()) {
    return;
  }
  describe(`${_.upperFirst(file)}Module`, () => {
    fs.readdirSync(subdir).forEach(function(subfile) {
      if (subfile.match(/\.js$/) !== null && subfile !== 'index.js') {
        require(`./${file}/${subfile}`);
      }
    });
  });
});
