const assert = require('assert');
const sinon = require('sinon');

const EventsRegistry = require('../../src/registries/events');
const TriggerEventCore = require('../../src/cores/trigger_event');

var sandbox = sinon.sandbox.create();

describe('TriggerEventCore', () => {

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
        if: 'val'
      }]
    };

    it('returns true for current scene', () => {
      const actionContext = {
        scriptContent: scriptContent,
        evalContext: { currentSceneName: 'SCENE-1' }
      };
      const res = TriggerEventCore.isSceneActive('SCENE-1', actionContext);
      assert.strictEqual(res, true);
    });

    it('returns false for ended scene with active page', () => {
      const actionContext = {
        scriptContent: scriptContent,
        evalContext: {
          Role: { currentPageName: 'PAGE-1' },
          currentSceneName: 'SCENE-2'
        }
      };
      const res = TriggerEventCore.isSceneActive('SCENE-1', actionContext);
      assert.strictEqual(res, false);
    });

    it('returns false for not-yet-started scene with active page', () => {
      const actionContext = {
        scriptContent: scriptContent,
        evalContext: {
          Role: { currentPageName: 'PAGE-1' },
          currentSceneName: 'SCENE-0'
        }
      };
      const res = TriggerEventCore.isSceneActive('SCENE-1', actionContext);
      assert.strictEqual(res, false);
    });

    it('returns true for global scene', () => {
      const actionContext = {
        scriptContent: scriptContent,
        evalContext: { currentSceneName: 'SCENE-2' }
      };
      const res = TriggerEventCore.isSceneActive('GLOBAL-1', actionContext);
      assert.strictEqual(res, true);
    });

    it('returns true for active conditional scene', () => {
      const actionContext = {
        scriptContent: scriptContent,
        evalContext: { currentSceneName: 'SCENE-2', val: 1 }
      };
      const res = TriggerEventCore.isSceneActive('COND-1', actionContext);
      assert.strictEqual(res, true);
    });

    it('returns false for inactive conditional scene', () => {
      const actionContext = {
        scriptContent: scriptContent,
        evalContext: { currentSceneName: 'SCENE-2', val: 0 }
      };
      const res = TriggerEventCore.isSceneActive('COND-1', actionContext);
      assert.strictEqual(res, false);
    });

    it('returns false for inactive scene', () => {
      const actionContext = {
        scriptContent: scriptContent,
        evalContext: {
          Role: { currentPageName: 'PAGE-1' },
          currentSceneName: 'SCENE-2'
        }
      };
      const res = TriggerEventCore.isSceneActive('SCENE-0', actionContext);
      assert.strictEqual(res, false);
    });
  });

  describe('#isTriggerActive', () => {
    it('returns true if no filters', () => {
      const trigger = {};
      const res = TriggerEventCore.isTriggerActive(trigger, {});
      assert.strictEqual(res, true);
    });

    it('returns true if active scene', () => {
      sandbox.stub(TriggerEventCore, 'isSceneActive').returns(true);
      const trigger = { scene: 'SCENE-1' };
      const res = TriggerEventCore.isTriggerActive(trigger, {});
      assert.strictEqual(res, true);
    });

    it('returns false if inactive scene', () => {
      sandbox.stub(TriggerEventCore, 'isSceneActive').returns(false);
      const trigger = { scene: 'SCENE-1' };
      const res = TriggerEventCore.isTriggerActive(trigger, {});
      assert.strictEqual(res, false);
    });

    it('returns true if if test passes', () => {
      const trigger = { if: 'test' };
      const actionContext = { evalContext: { test: true } };
      const res = TriggerEventCore.isTriggerActive(trigger, actionContext);
      assert.strictEqual(res, true);
    });

    it('returns false if if test fails', () => {
      const trigger = { if: 'test' };
      const actionContext = { evalContext: { test: false } };
      const res = TriggerEventCore.isTriggerActive(trigger, actionContext);
      assert.strictEqual(res, false);
    });

    it('returns true if non-repeatable and not previously run', () => {
      const trigger = { name: 't', repeatable: false };
      const actionContext = { evalContext: {} };
      const res = TriggerEventCore.isTriggerActive(trigger, actionContext);
      assert.strictEqual(res, true);
    });

    it('returns false if non-repeatable and previously run', () => {
      const trigger = { name: 't', repeatable: false };
      const actionContext = { evalContext: { history: { t: 'past time' } } };
      const res = TriggerEventCore.isTriggerActive(trigger, actionContext);
      assert.strictEqual(res, false);
    });
  });

  describe('#doesEventFireTriggerEvent', () => {
    it('returns false on non-matching event', () => {
      const trigger = { events: [{ call_ended: {} }] };
      const event = { type: 'cue_signaled', };
      const res = TriggerEventCore.doesEventFireTriggerEvent(trigger, event, 
        null);
      assert.strictEqual(res, false);
    });

    it('returns result of event matcher', () => {
      const stub = sandbox
        .stub(EventsRegistry.cue_signaled, 'matchEvent')
        .returns(true);
      const triggerEvent = { cue_signaled: {} };
      const event = { type: 'cue_signaled' };
      const res = TriggerEventCore.doesEventFireTriggerEvent(triggerEvent, 
        event, null);
      assert.strictEqual(res, true);

      stub.returns(false);
      const res2 = TriggerEventCore.doesEventFireTriggerEvent(triggerEvent, 
        event, null);
      assert.strictEqual(res2, false);
    });
  });

  describe('#triggerEventForEventType', () => {
    it('returns matching event', () => {
      const trigger = {
        events: [{ thing_happened: { params: true } }]
      };
      const eventType = 'thing_happened';
      const res = TriggerEventCore.triggerEventForEventType(trigger,
        eventType);
      assert.strictEqual(res, trigger.events[0]);
    });

    it('skips non-matching event', () => {
      const trigger = {
        events: [{ thing_happened: { params: true } }]
      };
      const eventType = 'other_thing_happened';
      const res = TriggerEventCore.triggerEventForEventType(trigger,
        eventType);
      assert.strictEqual(res, null);
    });

    it('goes through multiple events to return matching one', () => {
      const trigger = {
        events: [
          { this_happened: { params: true } },
          { that_happened: { params: true } },
          { another_thing_happened: { params: true } }
        ]
      };
      const eventType = 'that_happened';
      const res = TriggerEventCore.triggerEventForEventType(trigger,
        eventType);
      assert.strictEqual(res, trigger.events[1]);
    });
  });

  describe('#doesEventFireTrigger', () => {
    it('detects matching case', () => {
      const trigger = { events: [{ cue_signaled: {} }] };
      const event = { type: 'cue_signaled' };
      const stub = sandbox
        .stub(TriggerEventCore, 'triggerEventForEventType')
        .returns(trigger.events[0]);
      const stub2 = sandbox
        .stub(TriggerEventCore, 'doesEventFireTriggerEvent')
        .returns(true);

      const res = TriggerEventCore.doesEventFireTrigger(trigger, event, {});
      assert.strictEqual(res, true);

      sinon.assert.calledWith(stub, trigger, event.type);
      sinon.assert.calledWith(stub2, trigger.events[0], event, {});
    });

    it('detects coarse non-matching case', () => {
      const trigger = { events: [{ cue_signaled: {} }] };
      const event = { type: 'cue_signaled' };
      const stub = sandbox
        .stub(TriggerEventCore, 'triggerEventForEventType')
        .returns(null);
      const stub2 = sandbox
        .stub(TriggerEventCore, 'doesEventFireTriggerEvent')
        .returns(false);

      const res = TriggerEventCore.doesEventFireTrigger(trigger, event, {});
      assert.strictEqual(res, false);

      sinon.assert.calledWith(stub, trigger, event.type);
      sinon.assert.notCalled(stub2);
    });

    it('detects fine non-matching case', () => {
      const trigger = { events: [{ cue_signaled: {} }] };
      const event = { type: 'cue_signaled' };
      const stub = sandbox
        .stub(TriggerEventCore, 'triggerEventForEventType')
        .returns(trigger.events[0]);
      const stub2 = sandbox
        .stub(TriggerEventCore, 'doesEventFireTriggerEvent')
        .returns(false);

      const res = TriggerEventCore
        .doesEventFireTrigger(trigger, event, {});
      assert.strictEqual(res, false);

      sinon.assert.calledWith(stub, trigger, event.type);
      sinon.assert.calledWith(stub2, trigger.events[0], event, {});
    });
  });

  describe('#triggersForEvent', () => {
    it('returns active and matching triggers', () => {
      sandbox
        .stub(TriggerEventCore, 'isTriggerActive')
        .callsFake(function(trigger, actionContext) {
          return trigger.scene !== 'SCENE-1';
        });

      sandbox
        .stub(TriggerEventCore, 'doesEventFireTrigger')
        .callsFake(function(trigger, event, actionContext) {
          return trigger.scene !== 'SCENE-3';
        });

      const event = {};
      const actionContext = {
        scriptContent: {
          triggers: [
            { scene: 'SCENE-1', events: [] },
            { scene: 'SCENE-2', events: [] },
            { scene: 'SCENE-3', events: [] }
          ]
        },
        evalContext: { currentSceneName: 'SCENE-1' }
      };

      const res = TriggerEventCore.triggersForEvent(event, actionContext);

      assert.deepStrictEqual(res, [actionContext.scriptContent.triggers[1]]);
    });
  });
});
