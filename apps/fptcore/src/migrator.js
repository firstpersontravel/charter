var _ = require('lodash');
var fs = require('fs');

var Migrations = [];

fs.readdirSync(__dirname + '/../migrations').forEach(function(file) {
  if (file.match(/\.js$/) === null) {
    return;
  }
  var migration = require('../migrations/' + file);
  var migrationNum = Number(file.split('-')[0]);
  Migrations.push({ num: migrationNum, migration: migration });
});


var Migrator = {};

/**
 * Return migrated script content up to version number.
 */
Migrator.migrateScriptContent = function(scriptContent) {
  var migratedScriptContent = scriptContent;
  if (!migratedScriptContent.meta) {
    migratedScriptContent.meta = { version: 0 };
  }
  var curMigrationNum = migratedScriptContent.meta.version;
  Migrations.forEach(function(migration) {
    if (curMigrationNum < migration.num) {
      migratedScriptContent = _.cloneDeep(migratedScriptContent);
      migration.migration(migratedScriptContent);
      migratedScriptContent.meta.version = migration.num;
    }
  });
  return migratedScriptContent;
};

module.exports = Migrator;
