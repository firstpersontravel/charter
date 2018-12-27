const fs = require('fs');

describe('Actions', () => {
  fs.readdirSync(`${__dirname}/`).forEach(function(file) {
    if (file.match(/\.js$/) !== null && file !== 'index.js') {
      require(`./${file}`);
      return;
    }
    const subdir = `${__dirname}/${file}/`;
    if (!fs.existsSync(subdir) || !fs.lstatSync(subdir).isDirectory()) {
      return;
    }
    fs.readdirSync(subdir).forEach(function(subfile) {
      if (subfile.match(/\.js$/) !== null && subfile !== 'index.js') {
        require(`./${file}/${subfile}`);
      }
    });
  });
});
