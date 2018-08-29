const assert = require('assert');
const sinon = require('sinon');

const Events = require('../src/events');
const TriggerEventCore = require('../src/trigger_event');

var sandbox = sinon.sandbox.create();

describe('TriggerEventCore', () => {

  afterEach(() => {
    sandbox.restore();
  });

  describe('#isTriggerActive', () => {
    it('returns true if no filters', () => {
      const trigger = { };
      const res = TriggerEventCore.isTriggerActive({}, {}, trigger);
      assert.strictEqual(res, true);
    });

    it('returns true if matching scene', () => {
      const trigger = { scene: 'SCENE-1' };
      const context = { currentSceneName: 'SCENE-1' };
      const res = TriggerEventCore.isTriggerActive({}, context, trigger);
      assert.strictEqual(res, true);
    });

    it('returns false if non-matching scene', () => {
      const trigger = { scene: 'SCENE-1' };
      const context = { currentSceneName: 'SCENE-2' };
      const res = TriggerEventCore.isTriggerActive({}, context, trigger);
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
        .doesEventFireTriggerEvent({}, trigger, event);
      assert.strictEqual(res, false);
    });

    it('returns result of event matcher', () => {
      const stub = sandbox
        .stub(Events.cue_signaled, 'matchEvent')
        .returns(true);
      const triggerEvent = { cue_signaled: {} };
      const event = { type: 'cue_signaled' };
      const res = TriggerEventCore
        .doesEventFireTriggerEvent({}, triggerEvent, event);
      assert.strictEqual(res, true);

      stub.returns(false);
      const res2 = TriggerEventCore
        .doesEventFireTriggerEvent({}, triggerEvent, event);
      assert.strictEqual(res2, false);
    });
  });

  describe('#doesEventFireTrigger', () => {
    it('returns result of single trigger event', () => {
      const stub = sandbox
        .stub(TriggerEventCore, 'doesEventFireTriggerEvent')
        .returns(true);

      const trigger = { event: { cue_signaled: {} } };
      const event = { type: 'cue_signaled' };
      const res = TriggerEventCore.doesEventFireTrigger({}, trigger, event);
      assert.strictEqual(res, true);

      stub.returns(false);
      const res2 = TriggerEventCore.doesEventFireTrigger({}, trigger, event);
      assert.strictEqual(res2, false);
    });

    it('returns result of multiple trigger events', () => {
      const stub = sandbox
        .stub(TriggerEventCore, 'doesEventFireTriggerEvent');
      stub
        .onFirstCall().returns(true)
        .onSecondCall().returns(false);

      const trigger = { event: [{ cue_signaled: {} }, { other: {} }] };
      const event = { type: 'cue_signaled' };
      const res = TriggerEventCore.doesEventFireTrigger({}, trigger, event);
      assert.strictEqual(res, true);

      sinon.assert.calledWith(stub, {}, trigger.event[0], event);
      sinon.assert.calledWith(stub, {}, trigger.event[1], event);

      // Try with no positive results
      stub.onSecondCall().returns(false);
      const res2 = TriggerEventCore.doesEventFireTrigger({}, trigger, event);
      assert.strictEqual(res2, false);
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
        .callsFake(function(script, trigger, event) {
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

  describe('#doesEventFireTrigger', () => {

    var cueStub;
    var messageStub;

    beforeEach(() => {
      cueStub = sandbox.stub(Events.cue_signaled, 'matchEvent');
      messageStub = sandbox.stub(Events.message_sent, 'matchEvent');
    });

    it('does not fire if no matcher exists', () => {
      const trigger = { event: { cue: 'cue' } };
      const event = { type: 'abc' };
      const res = TriggerEventCore.doesEventFireTrigger({}, trigger, event);
      assert.strictEqual(res, false);
    });

    it('does not fire if trigger event type does not match event', () => {
      const trigger = { event: { cue_signaled: 'cue' } };
      const event = { type: 'message_sent' };
      const res = TriggerEventCore.doesEventFireTrigger({}, trigger, event);
      assert.strictEqual(res, false);
      sinon.assert.notCalled(cueStub);
      sinon.assert.notCalled(messageStub);
    });

    it('returns true if matcher returns true', () => {
      cueStub.returns(true);
      const trigger = { event: { cue_signaled: 'cue' } };
      const event = { type: 'cue_signaled' };
      const res = TriggerEventCore.doesEventFireTrigger({}, trigger, event);
      assert.strictEqual(res, true);
      sinon.assert.calledWith(cueStub, {}, trigger.event.cue_signaled, event);
    });

    it('returns false if matcher returns false', () => {
      cueStub.returns(false);
      const trigger = { event: { cue_signaled: 'param' } };
      const event = { type: 'cue_signaled' };
      const res = TriggerEventCore.doesEventFireTrigger({}, trigger, event);
      assert.strictEqual(res, false);
      sinon.assert.calledWith(cueStub, {}, trigger.event.cue_signaled, event);
    });

    it('fires if any event matcher fires', () => {
      cueStub.returns(true);
      messageStub.returns(false);
      const trigger = {
        event: [
          { cue_signaled: 'cue' },
          { message_sent: 'other_param' }
        ]
      };
      const event = { type: 'cue_signaled' };
      assert.strictEqual(
        TriggerEventCore.doesEventFireTrigger({}, trigger, event),
        true);
      sinon.assert.calledWith(
        cueStub, {}, trigger.event[0].cue_signaled, event);
      sinon.assert.notCalled(messageStub);
    });

    it('does not fire if no event matchers fire', () => {
      cueStub.returns(false);
      messageStub.returns(false);
      const trigger = {
        event: [
          { cue: 'cue' },
          { message_sent: 'other_param' }
        ]
      };
      const event = { type: 'message_sent' };
      assert.strictEqual(
        TriggerEventCore.doesEventFireTrigger({}, trigger, event),
        false);
      sinon.assert.notCalled(cueStub);
      sinon.assert.calledWith(
        messageStub, {}, trigger.event[1].message_sent, event);
    });
  });

});
