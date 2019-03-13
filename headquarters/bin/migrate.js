const _ = require('lodash');
const config = require('../src/config');
const models = require('../src/models');

const { ScriptCore } = require('fptcore');
const Migrator = require('../../apps/fptcore/src/migrator');

const logger = config.logger.child({ name: 'bin.migrate' });

async function migrateScript(script) {

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
  try {
    await script.update({ content: migrated });
    logger.info(`Script #${script.id} migrated from version ${oldVersion} to ${migrated.meta.version}.`);
  } catch (err) {
    logger.error(`Script #${script.id} (version ${oldVersion}) failed migration: ${err.message}.`);
  }

  try {
    await script.validate();
    logger.info(`Script #${script.id} passed validation!`);
  } catch (err) {
    logger.error(`Script #${script.id} failed validation: ${err.message}.`);
    err.errors[0].__raw.errors.forEach((innerErr) => {
      logger.error(`- ${innerErr.path}: ${innerErr.message}`);
    });
  }

}

async function migrateAll() {
  const scripts = await models.Script.findAll();
  for (const script of scripts) {
    await migrateScript(script);
  }
}

migrateAll()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
