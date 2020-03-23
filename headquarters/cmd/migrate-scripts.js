const _ = require('lodash');
const program = require('commander');

const ScriptCore = require('fptcore/src/cores/script');
const Migrator = require('fptcore/src/migrator');

const config = require('../src/config');
const models = require('../src/models');

const logger = config.logger.child({ name: 'bin.migrate' });

program
  .option('--dry-run', 'Dry run mode: do not save models.')
  .parse(process.argv);

async function migrateScript(script, isDryRun) {

  // For some reason, getting script.content updates `dataValues` which
  // triggers a validation error on the json field. So we do the get *after*
  // validating.
  const oldVersion = _.get(script.content, 'meta.version') || 0;
  const latestVersion = ScriptCore.CURRENT_VERSION;

  if (oldVersion >= latestVersion) {
    logger.info(`Script #${script.id} is up-to-date (version ${latestVersion}).`);
    return;
  }
  const migrated = Migrator.migrateScriptContent(script.content);
  script.set({ content: migrated });

  try {
    await script.validate();
    logger.info(`Script #${script.id} passed validation!`);
  } catch (err) {
    logger.error(`Script #${script.id} failed validation: ${err.message}.`);
    err.errors[0].__raw.errors.forEach((innerErr) => {
      logger.error(`- ${innerErr.path}: ${innerErr.message}`);
    });
  }

  if (!isDryRun) {
    try {
      await script.save({ fields: ['content'] });
      logger.info(`Script #${script.id} migrated from version ${oldVersion} to ${migrated.meta.version}.`);
    } catch (err) {
      logger.error(`Script #${script.id} (version ${oldVersion}) failed migration: ${err.message}.`);
    }
  }
}

async function migrateAll(isDryRun) {
  const scripts = await models.Script.findAll();
  for (const script of scripts) {
    await migrateScript(script, isDryRun);
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
