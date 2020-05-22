const assert = require('assert');
const sinon = require('sinon');

const coreRegistry = require('../../src/core-registry');
const KernelTriggers = require('../../src/kernel/triggers');

var sandbox = sinon.sandbox.create();

describe('KernelTriggers', () => {
  afterEach(() => {
    sandbox.restore();
  });

  describe('#isSceneActive', () => {
    const scriptContent = {
      roles: [{
        name: 'Role'
      }],
      pages: [{
        name: 'PAGE-1',
        scene: 'SCENE-1'
      }],
      scenes: [{
        name: 'SCENE-0'
      }, {
        name: 'SCENE-1'
      }, {
        name: 'SCENE-2'
      }, {
        name: 'GLOBAL-1',
        global: true
      }, {
        name: 'COND-1',
        global: true,
        active_if: { op: 'value_is_true', ref: 'val' }
      }]
    };

    it('returns true for current scene', () => {
      const actionContext = {
        scriptContent: scriptContent,
        evalContext: { tripState: { currentSceneName: 'SCENE-1' } }
      };
      const res = KernelTriggers.isSceneActive('SCENE-1', actionContext);
      assert.strictEqual(res, true);
    });

    it('returns false for ended scene with active page', () => {
      const actionContext = {
        scriptContent: scriptContent,
        evalContext: {
          Role: { currentPageName: 'PAGE-1' },
          tripState: { currentSceneName: 'SCENE-2' }
        }
      };
      const res = KernelTriggers.isSceneActive('SCENE-1', actionContext);
      assert.strictEqual(res, false);
    });

    it('returns false for not-yet-started scene with active page', () => {
      const actionContext = {
        scriptContent: scriptContent,
        evalContext: {
          Role: { currentPageName: 'PAGE-1' },
          tripState: { currentSceneName: 'SCENE-0' }
        }
      };
      const res = KernelTriggers.isSceneActive('SCENE-1', actionContext);
      assert.strictEqual(res, false);
    });

    it('returns true for global scene', () => {
      const actionContext = {
        scriptContent: scriptContent,
        evalContext: { tripState: { currentSceneName: 'SCENE-2' } }
      };
      const res = KernelTriggers.isSceneActive('GLOBAL-1', actionContext);
      assert.strictEqual(res, true);
    });

    it('returns false for non-current scene', () => {
      const actionContext = {
        scriptContent: scriptContent,
        evalContext: {
          Role: { currentPageName: 'PAGE-1' },
          tripState: { currentSceneName: 'SCENE-2' }
        }
      };
      const res = KernelTriggers.isSceneActive('SCENE-0', actionContext);
      assert.strictEqual(res, false);
    });
  });

  describe('#isTriggerActive', () => {
    it('returns true if no filters', () => {
      const trigger = {};
      const res = KernelTriggers.isTriggerActive(trigger, {});
      assert.strictEqual(res, true);
    });

    it('returns true if active scene', () => {
      sandbox.stub(KernelTriggers, 'isSceneActive').returns(true);
      const trigger = { scene: 'SCENE-1' };
      const res = KernelTriggers.isTriggerActive(trigger, {});
      assert.strictEqual(res, true);
    });

    it('returns false if inactive scene', () => {
      sandbox.stub(KernelTriggers, 'isSceneActive').returns(false);
      const trigger = { scene: 'SCENE-1' };
      const res = KernelTriggers.isTriggerActive(trigger, {});
      assert.strictEqual(res, false);
    });

    it('returns true if if test passes', () => {
      const trigger = { active_if: { op: 'value_is_true', ref: 'test' } };
      const actionContext = { evalContext: { test: true } };
      const res = KernelTriggers.isTriggerActive(trigger, actionContext);
      assert.strictEqual(res, true);
    });

    it('returns false if if test fails', () => {
      const trigger = { active_if: { op: 'value_is_true', ref: 'test' } };
      const actionContext = { evalContext: { test: false } };
      const res = KernelTriggers.isTriggerActive(trigger, actionContext);
      assert.strictEqual(res, false);
    });

    it('returns true if non-repeatable and not previously run', () => {
      const trigger = { name: 't', repeatable: false };
      const actionContext = { evalContext: {} };
      const res = KernelTriggers.isTriggerActive(trigger, actionContext);
      assert.strictEqual(res, true);
    });

    it('returns false if non-repeatable and previously run', () => {
      const trigger = { name: 't', repeatable: false };
      const actionContext = { evalContext: { history: { t: 'past time' } } };
      const res = KernelTriggers.isTriggerActive(trigger, actionContext);
      assert.strictEqual(res, false);
    });
  });

  describe('#doesEventFireTriggerEvent', () => {
    it('returns false on non-matching event', () => {
      const trigger = { event: { call_ended: {} } };
      const event = { type: 'cue_signaled', };
      const res = KernelTriggers.doesEventFireTriggerEvent(trigger.event,
        event, null);
      assert.strictEqual(res, false);
    });

    it('returns result of event matcher', () => {
      const stub = sandbox
        .stub(coreRegistry.events.cue_signaled, 'matchEvent')
        .returns(true);
      const triggerEvent = { type: 'cue_signaled' };
      const event = { type: 'cue_signaled' };
      const res = KernelTriggers.doesEventFireTriggerEvent(triggerEvent, 
        event, null);
      assert.strictEqual(res, true);

      stub.returns(false);
      const res2 = KernelTriggers.doesEventFireTriggerEvent(triggerEvent, 
        event, null);
      assert.strictEqual(res2, false);
    });
  });

  describe('#doesEventFireTrigger', () => {
    const actionContext = { evalContext: {} };

    it('detects matching case', () => {
      const trigger = { event: { type: 'cue_signaled' } };
      const event = { type: 'cue_signaled' };
      const stub2 = sandbox
        .stub(KernelTriggers, 'doesEventFireTriggerEvent')
        .returns(true);

      const res = KernelTriggers.doesEventFireTrigger(trigger, event,
        actionContext);
      assert.strictEqual(res, true);

      sinon.assert.calledWith(stub2, trigger.event, event, actionContext);
    });

    it('detects non-matching case', () => {
      const trigger = { event: { type: 'cue_signaled' } };
      const event = { type: 'cue_signaled' };
      const stub2 = sandbox
        .stub(KernelTriggers, 'doesEventFireTriggerEvent')
        .returns(false);

      const res = KernelTriggers.doesEventFireTrigger(trigger, event,
        actionContext);
      assert.strictEqual(res, false);

      sinon.assert.calledWith(stub2, trigger.event, event, actionContext);
    });
  });

  describe('#triggersForEvent', () => {
    it('returns active and matching triggers', () => {
      sandbox
        .stub(KernelTriggers, 'isTriggerActive')
        .callsFake(function(trigger, actionContext) {
          return trigger.scene !== 'SCENE-1';
        });

      sandbox
        .stub(KernelTriggers, 'doesEventFireTrigger')
        .callsFake(function(trigger, event, actionContext) {
          return trigger.scene !== 'SCENE-3';
        });

      const event = {};
      const actionContext = {
        scriptContent: {
          triggers: [
            { scene: 'SCENE-1', event: {} },
            { scene: 'SCENE-2', event: {} },
            { scene: 'SCENE-3', event: {} }
          ]
        },
        evalContext: { tripState: { currentSceneName: 'SCENE-1' } }
      };

      const res = KernelTriggers.triggersForEvent(event, actionContext);

      assert.deepStrictEqual(res, [actionContext.scriptContent.triggers[1]]);
    });
  });
});
