const _ = require('lodash');
const fs = require('fs');

const coreRegistry = require('./core-registry');
const TextUtil = require('./utils/text');
const Walker = require('./utils/walker');

const walker = new Walker(coreRegistry);

const Migrator = {};

const migrations = [];

for (const file of fs.readdirSync(__dirname + '/../migrations')) {
  if (file.match(/\.js$/) === null) {
    return;
  }
  const migration = require('../migrations/' + file);
  const num = Number(file.split('-')[0]);
  migrations.push({
    num: num,
    name: file.replace('.js', ''),
    migrations: migration.migrations,
    tests: migration.tests
  });
}

Migrator.Migrations = _.sortBy(migrations, 'num');

Migrator.getMigrations = function(currentMigrationNum) {
  return Migrator.Migrations.filter(function(migration) {
    return migration.num > currentMigrationNum;
  });
};

Migrator.runMigration = function(collectionName, migration, scriptContent) {
  if (collectionName === 'scriptContent') {
    migration(scriptContent);
    return;
  }
  if (coreRegistry.components[collectionName]) {
    const componentType = collectionName;
    walker.walkAllFields(scriptContent, componentType, (value, spec) => (
      migration(value, scriptContent)
    ));
    return;
  }
  const resourceType = TextUtil.singularize(collectionName);
  if (!coreRegistry.resources[resourceType]) {
    // throw new Error('Illegal collection name ' + collectionName);
    return;
  }
  if (!scriptContent[collectionName]) {
    return;
  }
  for (const item of scriptContent[collectionName].slice()) {
    migration(item, scriptContent);
  }
};

Migrator.runMigrations = function(migrations, scriptContent) {
  for (const collectionName of Object.keys(migrations)) {
    const migration = migrations[collectionName];
    Migrator.runMigration(collectionName, migration, scriptContent);
  }
};

/**
 * Return migrated script content up to version number.
 */
Migrator.migrateScriptContent = function(scriptContent) {
  var migrated = _.cloneDeep(scriptContent);
  if (!migrated.meta) {
    migrated.meta = { version: 0 };
  }
  var currentMigrationNum = migrated.meta.version;
  for (const migration of Migrator.getMigrations(currentMigrationNum)) {
    Migrator.runMigrations(migration.migrations, migrated);
    migrated.meta.version = migration.num;
  }
  return migrated;
};

module.exports = Migrator;
