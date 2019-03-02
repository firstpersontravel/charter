const _ = require('lodash');
const config = require('../src/config');
const models = require('../src/models');

const { ScriptCore } = require('fptcore');
const Migrator = require('../../apps/fptcore/src/migrator');

const logger = config.logger.child({ name: 'bin.migrate' });

async function migrateScript(script) {

  try {
    await script.validate();
  } catch (err) {
    logger.error(`Script #${script.id} failed validation: ${err.message}.`);
  }

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
    logger.info(`Script #${script.id} migrated to version ${migrated.meta.version}.`);
  } catch (err) {
    logger.error(`Script #${script.id} failed migration: ${err.message}.`);
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
