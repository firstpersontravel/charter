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

Migrator.runMigration = function(collectionName, migrateFn, scriptContent, 
  assets) {
  if (collectionName === 'scriptContent') {
    migrateFn(scriptContent, assets);
    return;
  }
  if (coreRegistry.components[collectionName]) {
    const componentType = collectionName;
    walker.walkAllFields(scriptContent, componentType,
      (collectionName, resource, value, spec) => (
        migrateFn(value, scriptContent, resource, assets)
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
    migrateFn(item, scriptContent, assets);
  }
};

Migrator.getMigrationFns = function(migrations) {
  if (Array.isArray(migrations)) {
    return migrations;
  }
  return Object.entries(migrations);
};

Migrator.runMigrations = function(migrations, scriptContent, assets) {
  const migrateFns = Migrator.getMigrationFns(migrations);
  for (const [collectionName, migrateFn] of migrateFns) {
    Migrator.runMigration(collectionName, migrateFn, scriptContent, assets);
  }
};

/**
 * Return migrated script content up to version number.
 */
Migrator.migrateScriptContent = function(scriptContent, assets) {
  var migrated = _.cloneDeep(scriptContent);
  if (!migrated.meta) {
    migrated.meta = { version: 0 };
  }
  var currentMigrationNum = migrated.meta.version;
  for (const migration of Migrator.getMigrations(currentMigrationNum)) {
    Migrator.runMigrations(migration.migrations, migrated, assets);
    migrated.meta.version = migration.num;
  }
  return migrated;
};

module.exports = Migrator;
