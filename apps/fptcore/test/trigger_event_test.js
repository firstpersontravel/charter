const assert = require('assert');
const sinon = require('sinon');

const Events = require('../src/events');
const TriggerEventCore = require('../src/trigger_event');

var sandbox = sinon.sandbox.create();

describe('TriggerEventCore', () => {

  afterEach(() => {
    sandbox.restore();
  });

  describe('#isSceneActive', () => {

    const script = {
      content: {
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
      }
    };

    it('returns true for current scene', () => {
      const context = { currentSceneName: 'SCENE-1' };
      const res = TriggerEventCore.isSceneActive(script, context, 'SCENE-1');
      assert.strictEqual(res, true);
    });

    it('returns true for ending scene', () => {
      const context = {
        Role: { currentPageName: 'PAGE-1' },
        currentSceneName: 'SCENE-2'
      };
      const res = TriggerEventCore.isSceneActive(script, context, 'SCENE-1');
      assert.strictEqual(res, true);
    });

    it('returns false for not-yet-started scene', () => {
      const context = {
        Role: { currentPageName: 'PAGE-1' },
        currentSceneName: 'SCENE-0'
      };
      const res = TriggerEventCore.isSceneActive(script, context, 'SCENE-1');
      assert.strictEqual(res, false);
    });

    it('returns true for global scene', () => {
      const context = { currentSceneName: 'SCENE-2' };
      const res = TriggerEventCore.isSceneActive(script, context, 'GLOBAL-1');
      assert.strictEqual(res, true);
    });

    it('returns true for active conditional scene', () => {
      const context = { currentSceneName: 'SCENE-2', val: 1 };
      const res = TriggerEventCore.isSceneActive(script, context, 'COND-1');
      assert.strictEqual(res, true);
    });

    it('returns false for inactive conditional scene', () => {
      const context = { currentSceneName: 'SCENE-2', val: 0 };
      const res = TriggerEventCore.isSceneActive(script, context, 'COND-1');
      assert.strictEqual(res, false);
    });

    it('returns false for inactive scene', () => {
      const context = {
        Role: { currentPageName: 'PAGE-1' },
        currentSceneName: 'SCENE-2'
      };
      const res = TriggerEventCore.isSceneActive(script, context, 'SCENE-0');
      assert.strictEqual(res, false);
    });
  });

  describe('#isTriggerActive', () => {
    it('returns true if no filters', () => {
      const trigger = {};
      const res = TriggerEventCore.isTriggerActive({}, {}, trigger);
      assert.strictEqual(res, true);
    });

    it('returns true if active scene', () => {
      sandbox.stub(TriggerEventCore, 'isSceneActive').returns(true);
      const trigger = { scene: 'SCENE-1' };
      const res = TriggerEventCore.isTriggerActive({}, {}, trigger);
      assert.strictEqual(res, true);
    });

    it('returns false if inactive scene', () => {
      sandbox.stub(TriggerEventCore, 'isSceneActive').returns(false);
      const trigger = { scene: 'SCENE-1' };
      const res = TriggerEventCore.isTriggerActive({}, {}, trigger);
      assert.strictEqual(res, false);
    });

    it('returns true if matching page', () => {
      const trigger = { page: 'PAGE-1' };
      const script = {
        content: { pages: [{ name: 'PAGE-1', role: 'User' }] }
      };
      const context = { User: { currentPageName: 'PAGE-1' } };
      const res = TriggerEventCore.isTriggerActive(script, context, trigger);
      assert.strictEqual(res, true);
    });

    it('returns false if non-matching page', () => {
      const trigger = { page: 'PAGE-1' };
      const script = {
        content: { pages: [{ name: 'PAGE-1', role: 'User' }] }
      };
      const context = { User: { currentPageName: 'PAGE-2' } };
      const res = TriggerEventCore.isTriggerActive(script, context, trigger);
      assert.strictEqual(res, false);
    });

    it('returns true if if test passes', () => {
      const trigger = { if: 'test' };
      const context = { test: true };
      const res = TriggerEventCore.isTriggerActive({}, context, trigger);
      assert.strictEqual(res, true);
    });

    it('returns false if if test fails', () => {
      const trigger = { if: 'test' };
      const context = { test: false };
      const res = TriggerEventCore.isTriggerActive({}, context, trigger);
      assert.strictEqual(res, false);
    });

    it('returns true if non-repeatable and not previously run', () => {
      const trigger = { name: 't', repeatable: false };
      const context = {};
      const res = TriggerEventCore.isTriggerActive({}, context, trigger);
      assert.strictEqual(res, true);
    });

    it('returns false if non-repeatable and previously run', () => {
      const trigger = { name: 't', repeatable: false };
      const context = { history: { t: 'past time' } };
      const res = TriggerEventCore.isTriggerActive({}, context, trigger);
      assert.strictEqual(res, false);
    });
  });

  describe('#doesEventFireTriggerEvent', () => {
    it('returns false on non-matching event', () => {
      const trigger = { event: { call_ended: {} } };
      const event = { type: 'cue_signaled', };
      const res = TriggerEventCore
        .doesEventFireTriggerEvent({}, {}, trigger, event);
      assert.strictEqual(res, false);
    });

    it('returns result of event matcher', () => {
      const stub = sandbox
        .stub(Events.cue_signaled, 'matchEvent')
        .returns(true);
      const triggerEvent = { cue_signaled: {} };
      const event = { type: 'cue_signaled' };
      const res = TriggerEventCore
        .doesEventFireTriggerEvent({}, {}, triggerEvent, event);
      assert.strictEqual(res, true);

      stub.returns(false);
      const res2 = TriggerEventCore
        .doesEventFireTriggerEvent({}, {}, triggerEvent, event);
      assert.strictEqual(res2, false);
    });
  });

  describe('#triggerEventForEventType', () => {
    it('returns matching event', () => {
      const trigger = {
        event: { thing_happened: { params: true } }
      };
      const eventType = 'thing_happened';
      const res = TriggerEventCore.triggerEventForEventType(trigger, eventType);
      assert.strictEqual(res, trigger.event);
    });

    it('skips non-matching event', () => {
      const trigger = {
        event: { thing_happened: { params: true } }
      };
      const eventType = 'other_thing_happened';
      const res = TriggerEventCore.triggerEventForEventType(trigger, eventType);
      assert.strictEqual(res, null);
    });

    it('goes through multiple events to return matching one', () => {
      const trigger = {
        event: [
          { this_happened: { params: true } },
          { that_happened: { params: true } },
          { another_thing_happened: { params: true } }
        ]
      };
      const eventType = 'that_happened';
      const res = TriggerEventCore.triggerEventForEventType(trigger, eventType);
      assert.strictEqual(res, trigger.event[1]);
    });
  });

  describe('#doesEventFireTrigger', () => {
    it('detects matching case', () => {
      const trigger = { event: { cue_signaled: {} } };
      const event = { type: 'cue_signaled' };
      const stub = sandbox
        .stub(TriggerEventCore, 'triggerEventForEventType')
        .returns(trigger.event);
      const stub2 = sandbox
        .stub(TriggerEventCore, 'doesEventFireTriggerEvent')
        .returns(true);

      const res = TriggerEventCore
        .doesEventFireTrigger({}, {}, trigger, event);
      assert.strictEqual(res, true);

      sinon.assert.calledWith(stub, trigger, event.type);
      sinon.assert.calledWith(stub2, {}, {}, trigger.event, event);
    });

    it('detects coarse non-matching case', () => {
      const trigger = { event: { cue_signaled: {} } };
      const event = { type: 'cue_signaled' };
      const stub = sandbox
        .stub(TriggerEventCore, 'triggerEventForEventType')
        .returns(null);
      const stub2 = sandbox
        .stub(TriggerEventCore, 'doesEventFireTriggerEvent')
        .returns(false);

      const res = TriggerEventCore
        .doesEventFireTrigger({}, {}, trigger, event);
      assert.strictEqual(res, false);

      sinon.assert.calledWith(stub, trigger, event.type);
      sinon.assert.notCalled(stub2);
    });

    it('detects fine non-matching case', () => {
      const trigger = { event: { cue_signaled: {} } };
      const event = { type: 'cue_signaled' };
      const stub = sandbox
        .stub(TriggerEventCore, 'triggerEventForEventType')
        .returns(trigger.event);
      const stub2 = sandbox
        .stub(TriggerEventCore, 'doesEventFireTriggerEvent')
        .returns(false);

      const res = TriggerEventCore
        .doesEventFireTrigger({}, {}, trigger, event);
      assert.strictEqual(res, false);

      sinon.assert.calledWith(stub, trigger, event.type);
      sinon.assert.calledWith(stub2, {}, {}, trigger.event, event);
    });
  });

  describe('#triggersForEvent', () => {

    it('returns active and matching triggers', () => {
      sandbox
        .stub(TriggerEventCore, 'isTriggerActive')
        .callsFake(function(script, context, trigger) {
          return trigger.scene !== 'SCENE-1';
        });

      sandbox
        .stub(TriggerEventCore, 'doesEventFireTrigger')
        .callsFake(function(script, context, trigger, event) {
          return trigger.scene !== 'SCENE-3';
        });

      const event = {};
      const script = {
        content: {
          triggers: [
            { scene: 'SCENE-1', event: {} },
            { scene: 'SCENE-2', event: {} },
            { scene: 'SCENE-3', event: {} }]
        }
      };
      const context = { currentSceneName: 'SCENE-1' };
      const res = TriggerEventCore.triggersForEvent(script, context, event);

      assert.deepStrictEqual(res, [script.content.triggers[1]]);
    });
  });
});
