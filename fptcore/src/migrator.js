var _ = require('lodash');
var fs = require('fs');

var ResourcesRegistry = require('./registries/resources');
var ScriptCore = require('./cores/script');
var TextUtil = require('./utils/text');
var TriggerActionCore = require('./cores/trigger_action');

var Migrator = {};

var migrations = [];

fs.readdirSync(__dirname + '/../migrations').forEach(function(file) {
  if (file.match(/\.js$/) === null) {
    return;
  }
  var migration = require('../migrations/' + file);
  var num = Number(file.split('-')[0]);
  migrations.push({
    num: num,
    name: file.replace('.js', ''),
    migrations: migration.migrations,
    tests: migration.tests
  });
});

Migrator.Migrations = _.sortBy(migrations, 'num');

Migrator.getMigrations = function(currentMigrationNum) {
  return Migrator.Migrations.filter(function(migration) {
    return migration.num > currentMigrationNum;
  });
};

function walkIfExpressions(ifClause, iteree) {
  if (!ifClause) {
    return;
  }
  if (ifClause.op === 'and' || ifClause.op === 'or') {
    ifClause.items.forEach(item => walkIfExpressions(item, iteree));
    return;
  }
  if (ifClause.op === 'not') {
    walkIfExpressions(ifClause.item, iteree);
    return;
  }
  iteree(ifClause);
}

Migrator.runMigration = function(collectionName, migration, scriptContent) {
  if (collectionName === 'scriptContent') {
    migration(scriptContent);
    return;
  }
  var triggers = scriptContent.triggers || [];
  if (collectionName === 'actions') {
    triggers.forEach(function(trigger) {
      TriggerActionCore.walkPackedActions(trigger.actions, '', action => (
        migration(action, scriptContent)
      ), () => {});
    });
    return;
  }
  if (collectionName === 'ifClauses') {
    ScriptCore.walkParams(scriptContent, 'ifClause', (ifClause, spec) => (
      migration(ifClause, scriptContent)
    ));
    return;
  }
  if (collectionName === 'ifExpressions') {
    ScriptCore.walkParams(scriptContent, 'ifClause', (ifClause, spec) => (
      walkIfExpressions(ifClause, ifExpression => (
        migration(ifExpression, scriptContent)
      ))
    ));
    return;
  }
  if (collectionName === 'eventSpecs') {
    triggers.forEach(function(trigger) {
      trigger.events.forEach(function(eventSpec) {
        migration(eventSpec, scriptContent);
      });
    });
    return;
  }
  var resourceType = TextUtil.singularize(collectionName);
  if (!ResourcesRegistry[resourceType]) {
    // throw new Error('Illegal collection name ' + collectionName);
    return;
  }
  if (!scriptContent[collectionName]) {
    return;
  }
  scriptContent[collectionName].forEach(function(item) {
    migration(item, scriptContent);
  });
};

Migrator.runMigrations = function(migrations, scriptContent) {
  Object
    .keys(migrations)
    .forEach(function(collectionName) {
      var migration = migrations[collectionName];
      Migrator.runMigration(collectionName, migration, scriptContent);
    });
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
  Migrator
    .getMigrations(currentMigrationNum)
    .forEach(function(migration) {
      Migrator.runMigrations(migration.migrations, migrated);
      migrated.meta.version = migration.num;
    });
  return migrated;
};

module.exports = Migrator;
