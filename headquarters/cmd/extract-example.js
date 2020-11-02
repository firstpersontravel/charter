const fs = require('fs');
const program = require('commander');
const yaml = require('js-yaml');
const path = require('path');

const models = require('../src/models');

program
  .option('-o --org [org]')
  .option('-e --experience [experience]')
  .option('-n --name [name]')
  .parse(process.argv);

if (!program.org || !program.experience || !program.name) {
  program.help();
  process.exit(1);
}

const hqPath = path.resolve(path.dirname(__dirname));
const examplesPath = path.join(hqPath, 'examples');

async function extractExample({ org, experience, name }) {
  const script = await models.Script.findOne({
    where: { isActive: true, isArchived: false },
    include: [{
      model: models.Experience,
      where: { name: experience },
      as: 'experience'
    }, {
      model: models.Org,
      where: { name: org },
      as: 'org'
    }]
  });
  if (!script) {
    console.error('No script found.');
    process.exit(1);
  }
  console.log(`Script #${script.id}`);
  const assets = await models.Asset.findAll({
    where: { isArchived: false },
    include: [{
      model: models.Experience,
      where: { name: experience },
      as: 'experience'
    }, {
      model: models.Org,
      where: { name: org },
      as: 'org'
    }]
  });
  const exampleContent = {
    content: script.content,
    assets: assets.map(a => ({ name: a.name, type: a.type, data: a.data }))
  };
  const examplePath = path.join(examplesPath, `${name}.yaml`);
  const exampleYaml = yaml.safeDump(exampleContent);
  fs.writeFileSync(examplePath, exampleYaml);
}

extractExample(program)
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
