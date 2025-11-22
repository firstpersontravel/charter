const fs = require('fs');

function upperFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

fs.readdirSync(`${__dirname}/`).forEach(function(file) {
  const subdir = `${__dirname}/${file}/`;
  if (!fs.existsSync(subdir) || !fs.lstatSync(subdir).isDirectory()) {
    return;
  }
  describe(`${upperFirst(file)}Module`, () => {
    fs.readdirSync(subdir).forEach(function(subfile) {
      if (subfile.match(/\.js$/) !== null && subfile !== 'index.js') {
        require(`./${file}/${subfile}`);
      }
    });
  });
});
