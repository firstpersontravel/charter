const _ = require('lodash');
const program = require('commander');

const models = require('../src/models');

const ScriptCore = require('fptcore/src/cores/script');
const Migrator = require('fptcore/src/migrator');

program
  .option('--dry-run', 'Dry run mode: do not save models.')
  .parse(process.argv);

async function migrateScript(script, assets, isDryRun) {
  // For some reason, getting script.content updates `dataValues` which
  // triggers a validation error on the json field. So we do the get *after*
  // validating.
  const oldVersion = _.get(script.content, 'meta.version') || 0;
  const latestVersion = ScriptCore.CURRENT_VERSION;

  if (oldVersion >= latestVersion) {
    return null;
  }
  const migrated = Migrator.migrateScriptContent(script.content, assets);
  script.set({ content: migrated });

  try {
    await script.validate();
  } catch (err) {
    console.log(`Script #${script.id} failed validation: ${err.message}.`);
    err.errors[0].__raw.errors.forEach((innerErr) => {
      console.log(`- ${innerErr.path}: ${innerErr.message}`);
    });
    return false;
  }

  if (isDryRun) {
    return null;
  }

  try {
    await script.save({ fields: ['content'] });
  } catch (err) {
    console.log(`Script #${script.id} (version ${oldVersion}) failed migration: ${err.message}.`);
    return false;
  }
  return true;
}

async function migrateAll(isDryRun) {
  let numFailed = 0;
  let numSucceeded = 0;
  let numNoop = 0;
  const experiences = await models.Experience.findAll();
  for (const experience of experiences) {
    const scripts = await models.Script.findAll({
      where: { experienceId: experience.id }
    });
    const assets = await models.Asset.findAll({
      where: { experienceId: experience.id }
    });
    for (const script of scripts) {
      const res = await migrateScript(script, assets, isDryRun);
      if (res === true) {
        numSucceeded++;
      } else if (res === false) {
        numFailed++;
      } else {
        numNoop++;
      }
    }
  }
  console.log(
    `${numSucceeded} ok, ${numFailed} failed, ${numNoop} no change.`);
}

migrateAll(program.dryRun)
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
