const program = require('commander');

const models = require('../src/models');

program
  .arguments('<name> <title>')
  .parse(process.argv);

async function createOrg(name, title) {
  await models.Org.findOrCreate({
    where: { name: name },
    defaults: { title: title }
  });
}

if (program.args.length < 2) {
  program.help();
}


createOrg(...program.args)
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
