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

      const migrated = Migrator.migrateScriptContent(scriptContent, []);

      sinon.assert.calledOnce(migrationStub);

      assert.strictEqual(migrated.meta.version, 2);
    });

    it('runs no migrations if up-to-date', () => {
      const scriptContent = { meta: { version: 2 } };
      sandbox.stub(Migrator, 'getMigrations').returns([]);

      const migrated = Migrator.migrateScriptContent(scriptContent, []);

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
      const assets = [{ asset: 1 }];
      const scriptContent = { scenes: [{ name: 1 }, { name: 2 }] };
      const migration = sinon.stub();

      Migrator.runMigration('scenes', migration, scriptContent, assets);

      sinon.assert.calledTwice(migration);
      assert.deepStrictEqual(migration.firstCall.args,
        [scriptContent.scenes[0], scriptContent, assets]);
      assert.deepStrictEqual(migration.secondCall.args,
        [scriptContent.scenes[1], scriptContent, assets]);
    });

    it('skips resources when absent', () => {
      const scriptContent = {};
      const migration = sinon.stub();

      Migrator.runMigration('roles', migration, scriptContent);

      sinon.assert.notCalled(migration);
    });

    it('migrates actions', () => {
      const trigger1 = {
        actions: [{ name: 'play_audio', audio_name: '2' }]
      };
      const trigger2 = {
        actions: [{
          name: 'conditional',
          if: { op: 'value_is_true', ref: '123' },
          actions: [{ name: 'play_audio', audio_name: '4' }],
          elseifs: [{
            if: { op: 'value_is_true', ref: '456' },
            actions: [{ name: 'play_audio', audio_name: '6' }],
          }],
          else: [{ name: 'play_audio', audio_name: '8' }],
        }]
      };
      const scriptContent = { triggers: [trigger1, trigger2] };
      const migration = sinon.stub();

      Migrator.runMigration('actions', migration, scriptContent);

      sinon.assert.callCount(migration, 5);
      sinon.assert.calledWith(
        migration.getCall(0), { name: 'play_audio', audio_name: '2' });
      // Then conditional
      sinon.assert.calledWith(
        migration.getCall(1), trigger2.actions[0]);
      // Then nested
      sinon.assert.calledWith(
        migration.getCall(2), { name: 'play_audio', audio_name: '4' });
      sinon.assert.calledWith(
        migration.getCall(3), { name: 'play_audio', audio_name: '6' });
      sinon.assert.calledWith(
        migration.getCall(4), { name: 'play_audio', audio_name: '8' });
    });

    it('migrates conditions', () => {
      const trigger2 = {
        actions: [{
          name: 'conditional',
          if: { op: 'value_is_true', ref: 'test2' },
          actions: [{ name: 'play_audio', audio_name: '4' }],
          elseifs: [{
            if: {
              op: 'and',
              items: [
                { op: 'value_is_true', ref: 'test3' },
                { op: 'not', item: { op: 'value_equals', ref1: 'a', ref2: 'b' } }
              ],
            },
            actions: [{ name: 'play_audio', audio_name: '6' }]
          }],
          else: [{ name: 'play_audio', audio_name: '8' }]
        }]
      };
      const sc = { triggers: [trigger2] };
      const migration = sinon.stub();

      Migrator.runMigration('conditions', migration, sc);

      sinon.assert.callCount(migration, 5);
      const t2act1 = trigger2.actions[0];
      const t2elseif1 = t2act1.elseifs[0];
      sinon.assert.calledWith(migration.getCall(0), t2act1.if, sc);
      sinon.assert.calledWith(migration.getCall(1), t2elseif1.if, sc);
      sinon.assert.calledWith(migration.getCall(2), t2elseif1.if.items[0], sc);
      sinon.assert.calledWith(migration.getCall(3), t2elseif1.if.items[1], sc);
      sinon.assert.calledWith(migration.getCall(4), t2elseif1.if.items[1].item,
        sc);
    });

    it('migrates event specs', () => {
      const scriptContent = {
        triggers: [{
          event: { spec: 3 }
        }]
      };
      const migration = sinon.stub();

      Migrator.runMigration('events', migration, scriptContent);

      sinon.assert.calledOnce(migration);
      sinon.assert.calledWith(migration.getCall(0), { spec: 3 });
    });
  });
});
