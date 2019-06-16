// const _ = require('lodash');
const assert = require('assert');
const sinon = require('sinon');

const Migrator = require('../src/migrator');

const sandbox = sinon.sandbox.create();

describe('Migrator', () => {
  afterEach(function() {
    sandbox.restore();
  });

  describe('#getMigrations', () => {
    it('returns migrations greater supplied number', () => {
      const returnedMigrations = Migrator.getMigrations(1);
      returnedMigrations.forEach(migration => (
        assert(migration.num > 1)
      ));
    });
  });

  describe('#migrateScriptContent', () => {
    it('runs migrations', () => {
      const scriptContent = { meta: { version: 1 } };
      const migrationStub = sinon.stub();
      sandbox.stub(Migrator, 'getMigrations').returns([{
        num: 2,
        migrations: { scriptContent: migrationStub }
      }]);

      const migrated = Migrator.migrateScriptContent(scriptContent);

      sinon.assert.calledOnce(migrationStub);

      assert.strictEqual(migrated.meta.version, 2);
    });

    it('runs no migrations if up-to-date', () => {
      const scriptContent = { meta: { version: 2 } };
      sandbox.stub(Migrator, 'getMigrations').returns([]);

      const migrated = Migrator.migrateScriptContent(scriptContent);

      assert.deepStrictEqual(migrated, scriptContent);
    });
  });

  describe('#runMigration', () => {
    it('migrates script content', () => {
      const scriptContent = { test: 3 };
      const migration = sinon.stub();

      Migrator.runMigration('scriptContent', migration, scriptContent);

      sinon.assert.calledOnce(migration);
      sinon.assert.calledWith(migration, scriptContent);
    });

    it('migrates resources', () => {
      const scriptContent = { scenes: [{ name: 1 }, { name: 2 }] };
      const migration = sinon.stub();

      Migrator.runMigration('scenes', migration, scriptContent);

      sinon.assert.calledTwice(migration);
      assert.deepStrictEqual(migration.firstCall.args,
        [scriptContent.scenes[0], scriptContent]);
      assert.deepStrictEqual(migration.secondCall.args,
        [scriptContent.scenes[1], scriptContent]);
    });

    it('skips resources when absent', () => {
      const scriptContent = {};
      const migration = sinon.stub();

      Migrator.runMigration('roles', migration, scriptContent);

      sinon.assert.notCalled(migration);
    });

    it('migrates actions', () => {
      const scriptContent = {
        triggers: [{
          actions: [{ name: 'play_audio', audio_name: '2' }]
        }, {
          actions: [{
            name: 'conditional',
            if: { op: 'istrue', ref: '123' },
            actions: [{ name: 'play_audio', audio_name: '4' }],
            elseifs: [{
              if: { op: 'istrue', ref: '456' },
              actions: [{ name: 'play_audio', audio_name: '6' }],
            }],
            else: [{ name: 'play_audio', audio_name: '8' }],
          }]
        }]
      };
      const migration = sinon.stub();

      Migrator.runMigration('actions', migration, scriptContent);

      sinon.assert.callCount(migration, 4);
      sinon.assert.calledWith(
        migration.getCall(0), { name: 'play_audio', audio_name: '2' });
      sinon.assert.calledWith(
        migration.getCall(1), { name: 'play_audio', audio_name: '4' });
      sinon.assert.calledWith(
        migration.getCall(2), { name: 'play_audio', audio_name: '6' });
      sinon.assert.calledWith(
        migration.getCall(3), { name: 'play_audio', audio_name: '8' });
    });

    const lotsOfIfs = {
      triggers: [{
        active_if: { op: 'istrue', ref: 'test1' },
        actions: [{ name: 'play_audio', audio_name: '2' }]
      }, {
        actions: [{
          name: 'conditional',
          if: { op: 'istrue', ref: 'test2' },
          actions: [{ name: 'play_audio', audio_name: '4' }],
          elseifs: [{
            if: {
              op: 'and',
              items: [
                { op: 'istrue', ref: 'test3' },
                { op: 'not', item: { op: 'equals', ref1: 'a', ref2: 'b' } }
              ],
            },
            actions: [{ name: 'play_audio', audio_name: '6' }]
          }],
          else: [{ name: 'play_audio', audio_name: '8' }]
        }]
      }]
    };

    it('migrates if clauses', () => {
      const migration = sinon.stub();

      Migrator.runMigration('ifClauses', migration, lotsOfIfs);

      sinon.assert.callCount(migration, 4);
      sinon.assert.calledWith(
        migration.getCall(0), { op: 'istrue', ref: 'test1' }, lotsOfIfs);
      sinon.assert.calledWith(
        migration.getCall(1), undefined, lotsOfIfs);
      sinon.assert.calledWith(
        migration.getCall(2), { op: 'istrue', ref: 'test2' }, lotsOfIfs);
      // Complex if statement
      sinon.assert.calledWith(
        migration.getCall(3), lotsOfIfs.triggers[1].actions[0].elseifs[0].if,
        lotsOfIfs);
    });

    it('migrates if expressions', () => {
      const migration = sinon.stub();

      Migrator.runMigration('ifExpressions', migration, lotsOfIfs);

      sinon.assert.callCount(migration, 4);
      sinon.assert.calledWith(
        migration.getCall(0), { op: 'istrue', ref: 'test1' }, lotsOfIfs);
      sinon.assert.calledWith(
        migration.getCall(1), { op: 'istrue', ref: 'test2' }, lotsOfIfs);
      sinon.assert.calledWith(
        migration.getCall(2), { op: 'istrue', ref: 'test3' }, lotsOfIfs);
      sinon.assert.calledWith(
        migration.getCall(3), { op: 'equals', ref1: 'a', ref2: 'b' },
        lotsOfIfs);
    });

    it('migrates event specs', () => {
      const scriptContent = {
        triggers: [{
          event: { spec: 3 }
        }]
      };
      const migration = sinon.stub();

      Migrator.runMigration('eventSpecs', migration, scriptContent);

      sinon.assert.calledOnce(migration);
      sinon.assert.calledWith(migration.getCall(0), { spec: 3 });
    });
  });
});
