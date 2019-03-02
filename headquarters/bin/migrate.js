const _ = require('lodash');
const config = require('../src/config');
const models = require('../src/models');

const { ScriptCore } = require('fptcore');
const Migrator = require('../../apps/fptcore/src/migrator');

var logger = config.logger.child({ name: 'bin.migrate' });

async function migrateScript(script) {
  const oldVersion = _.get(script.content, 'meta.version') || 0;
  const latestVersion = ScriptCore.CURRENT_VERSION;
  if (oldVersion === latestVersion) {
    logger.info(`Script #${script.id} is up-to-date (${latestVersion}).`);
    return;
  }
  const migrated = Migrator.migrateScriptContent(script.content);
  await script.update({ content: migrated });
  logger.info(`Script #${script.id} migrated to ${migrated.meta.version}.`);
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
