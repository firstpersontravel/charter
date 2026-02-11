const fs = require('fs');
import { cloneDeep } from './utils/lodash-replacements';

const coreRegistry = require('./core-registry');
const TextUtil = require('./utils/text');
const Walker = require('./utils/walker');

import type { ScriptContent, Migration, MigrationFn, MigrationFns } from './types';

const walker = new Walker(coreRegistry);

interface MigratorInterface {
  Migrations: Migration[];
  getMigrations(currentMigrationNum: number): Migration[];
  runMigration(collectionName: string, migrateFn: MigrationFn, scriptContent: ScriptContent, assets: unknown): void;
  getMigrationFns(migrations: MigrationFns): Array<[string, MigrationFn]>;
  runMigrations(migrations: MigrationFns, scriptContent: ScriptContent, assets: unknown): void;
  migrateScriptContent(scriptContent: ScriptContent, assets: unknown): ScriptContent;
}

const Migrator: MigratorInterface = {} as MigratorInterface;

const migrations: Migration[] = [];

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

Migrator.Migrations = migrations.sort((a, b) => a.num - b.num);

Migrator.getMigrations = function(currentMigrationNum: number): Migration[] {
  return Migrator.Migrations.filter(function(migration) {
    return migration.num > currentMigrationNum;
  });
};

Migrator.runMigration = function(collectionName: string, migrateFn: MigrationFn, scriptContent: ScriptContent,
  assets: unknown): void {
  if (collectionName === 'scriptContent') {
    migrateFn(scriptContent, assets);
    return;
  }
  if (coreRegistry.components[collectionName]) {
    const componentType = collectionName;
    walker.walkAllFields(scriptContent, componentType,
      (collectionName: string, resource: unknown, value: unknown, spec: unknown) => (
        migrateFn(value, scriptContent, resource, assets)
      ));
    return;
  }
  const resourceType = TextUtil.singularize(collectionName);
  if (!coreRegistry.resources[resourceType]) {
    return;
  }
  if (!scriptContent[collectionName]) {
    return;
  }
  for (const item of (scriptContent[collectionName] as unknown[]).slice()) {
    migrateFn(item, scriptContent, assets);
  }
};

Migrator.getMigrationFns = function(migrations: MigrationFns): Array<[string, MigrationFn]> {
  if (Array.isArray(migrations)) {
    return migrations as Array<[string, MigrationFn]>;
  }
  return Object.entries(migrations);
};

Migrator.runMigrations = function(migrations: MigrationFns, scriptContent: ScriptContent, assets: unknown): void {
  const migrateFns = Migrator.getMigrationFns(migrations);
  for (const [collectionName, migrateFn] of migrateFns) {
    Migrator.runMigration(collectionName, migrateFn, scriptContent, assets);
  }
};

/**
 * Return migrated script content up to version number.
 */
Migrator.migrateScriptContent = function(scriptContent: ScriptContent, assets: unknown): ScriptContent {
  const migrated = cloneDeep(scriptContent) as ScriptContent;
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
