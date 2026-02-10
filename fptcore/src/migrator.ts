const fs = require('fs');
import { cloneDeep } from './utils/lodash-replacements';

const coreRegistry = require('./core-registry');
const TextUtil = require('./utils/text');
const Walker = require('./utils/walker');

const walker = new Walker(coreRegistry);

const Migrator: any = {};

const migrations: any[] = [];

for (const file of fs.readdirSync(__dirname + '/../migrations')) {
  if (file.match(/\.(js|ts)$/) === null) {
    continue;
  }
  const migration = require('../migrations/' + file);
  const num = Number(file.split('-')[0]);
  migrations.push({
    num: num,
    name: file.replace(/\.(js|ts)$/, ''),
    migrations: migration.migrations,
    tests: migration.tests
  });
}

Migrator.Migrations = migrations.sort((a: any, b: any) => a.num - b.num);

Migrator.getMigrations = function(currentMigrationNum: number): any[] {
  return Migrator.Migrations.filter(function(migration: any) {
    return migration.num > currentMigrationNum;
  });
};

Migrator.runMigration = function(collectionName: string, migrateFn: Function, scriptContent: any,
  assets: any): void {
  if (collectionName === 'scriptContent') {
    migrateFn(scriptContent, assets);
    return;
  }
  if (coreRegistry.components[collectionName]) {
    const componentType = collectionName;
    walker.walkAllFields(scriptContent, componentType,
      (collectionName: string, resource: any, value: any, spec: any) => (
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

Migrator.getMigrationFns = function(migrations: any): any[] {
  if (Array.isArray(migrations)) {
    return migrations;
  }
  return Object.entries(migrations);
};

Migrator.runMigrations = function(migrations: any, scriptContent: any, assets: any): void {
  const migrateFns = Migrator.getMigrationFns(migrations);
  for (const [collectionName, migrateFn] of migrateFns) {
    Migrator.runMigration(collectionName, migrateFn, scriptContent, assets);
  }
};

/**
 * Return migrated script content up to version number.
 */
Migrator.migrateScriptContent = function(scriptContent: any, assets: any): any {
  const migrated = cloneDeep(scriptContent);
  if (!migrated.meta) {
    migrated.meta = { version: 0 };
  }
  const currentMigrationNum = migrated.meta.version;
  for (const migration of Migrator.getMigrations(currentMigrationNum)) {
    Migrator.runMigrations(migration.migrations, migrated, assets);
    migrated.meta.version = migration.num;
  }
  return migrated;
};

module.exports = Migrator;
