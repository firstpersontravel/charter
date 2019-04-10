const _ = require('lodash');
const assert = require('assert');

const ScriptCore = require('../src/cores/script');
const Migrator = require('../src/migrator');

describe('Migrations', () => {
  Migrator.Migrations.forEach((migration) => {
    it(migration.name, () => {
      if (!migration.tests) {
        assert.fail('Migration has no tests');
      }
      migration.tests.forEach(test => {
        const scriptContent = _.cloneDeep(test.before);
        Migrator.runMigrations(migration.migrations, scriptContent);
        assert.deepStrictEqual(scriptContent, test.after);
      });
    });
  });

  it('migrates up to script current version', () => {
    const maxNum = Math.max(..._.map(Migrator.Migrations, 'num'));
    assert.strictEqual(ScriptCore.CURRENT_VERSION, maxNum);
  });
});
