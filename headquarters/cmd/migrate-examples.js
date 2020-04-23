const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const program = require('commander');
const yaml = require('js-yaml');

const config = require('../src/config');

const ScriptCore = require('fptcore/src/cores/script');
const Migrator = require('fptcore/src/migrator');

const examplesPath = path.join(path.dirname(__dirname), 'examples');

const logger = config.logger.child({ name: 'bin.migrate' });

program
  .option('--dry-run', 'Dry run mode: do not save models.')
  .parse(process.argv);

async function migrateScript(exampleName, isDryRun) {
  const examplePath = path.join(examplesPath, `${exampleName}.yaml`);
  const exampleYaml = fs.readFileSync(examplePath, 'utf8');
  const exampleData = yaml.safeLoad(exampleYaml);

  // For some reason, getting script.content updates `dataValues` which
  // triggers a validation error on the json field. So we do the get *after*
  // validating.
  const oldVersion = _.get(exampleData.content, 'meta.version');
  const latestVersion = ScriptCore.CURRENT_VERSION;

  if (oldVersion >= latestVersion) {
    logger.info(
      `Example ${exampleName} is up-to-date (version ${latestVersion}).`);
    return;
  }
  const migratedContent = Migrator.migrateScriptContent(exampleData.content);

  try {
    ScriptCore.validateScriptContent(migratedContent);
    logger.info(`Example ${exampleName} passed validation!`);
  } catch (err) {
    logger.error(`Example ${exampleName} failed validation: ${err.message}.`);
    err.fieldErrors.forEach((innerErr) => {
      logger.error(`- ${innerErr.path}: ${innerErr.message}`);
    });
  }

  if (!isDryRun) {
    const migratedData = Object.assign({}, exampleData,
      { content: migratedContent });
    const migratedYaml = yaml.safeDump(migratedData);
    fs.writeFileSync(examplePath, migratedYaml);
  }
}

async function migrateAll(isDryRun) {
  const exampleFiles = fs.readdirSync(examplesPath);
  for (const exampleFile of exampleFiles) {
    if (exampleFile.endsWith('.yaml')) {
      await migrateScript(exampleFile.split('.')[0], isDryRun);
    }
  }
}

migrateAll(program.dryRun)
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
