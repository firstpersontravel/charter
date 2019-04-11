const assert = require('assert');
const sinon = require('sinon');
const moment = require('moment');

const ActionCore = require('../../src/cores/action');
const ActionsRegistry = require('../../src/registries/actions');
const TriggerActionCore = require('../../src/cores/trigger_action');
const TriggerEventCore = require('../../src/cores/trigger_event');

const sandbox = sinon.sandbox.create();

describe('ActionCore', () => {
  const addAction = {
    applyAction: function(script, context, params, applyAt) {
      return [{
        operation: 'updateTripValues',
        values: { number: (context.number || 0) + 1 }
      }];
    }
  };

  const now = moment.utc();

  beforeEach(() => {
    ActionsRegistry.add = addAction;
  });

  afterEach(() => {
    sandbox.restore();
    delete ActionsRegistry.add;
  });

  describe('#opsForAction', () => {
    it.skip('tbd');
  });

  describe('#addEventToContext', () => {
    it('adds event to context', () => {
      const event = { type: 'event' };
      const actionContext = { evalContext: { abc: '123' } };

      const result = ActionCore.addEventToContext(event, actionContext);

      assert.deepEqual(result.evalContext, { abc: '123', event: event });      
    });
  });

  describe('#applyActionSimple', () => {
    it('returns action results', () => {
      const action = { name: 'add', params: {} };
      const actionContext = { scriptContent: {}, evaluateAt: now };

      const result = ActionCore.applyActionSimple(action, actionContext);

      assert.deepStrictEqual(result.nextContext.evalContext, { number: 1 });
      assert.deepStrictEqual(result.resultOps, [{
        operation: 'updateTripValues',
        values: { number: 1 }
      }]);
    });
  });

  describe('#applyAction', () => {
    it('returns action results', () => {
      const action = { name: 'add', params: {} };
      const actionContext = { scriptContent: {}, evaluateAt: now };

      const result = ActionCore.applyAction(action, actionContext);

      assert.deepStrictEqual(result.nextContext.evalContext, { number: 1 });
      assert.deepStrictEqual(result.resultOps, [{
        operation: 'updateTripValues',
        values: { number: 1 }
      }]);
    });

    it('returns action and subsequent event results', () => {
      sandbox.stub(ActionCore, 'applyActionSimple')
        .callsFake(function(action, actionContext) {
          return {
            nextContext: actionContext,
            resultOps: [{ operation: 'event', event: { type: '123' }}],
            scheduledActions: []
          };
        });
      sandbox.stub(ActionCore, 'applyEvent')
        .callsFake(function(event, actionContext) {
          return {
            nextContext: { evalContext: { number: 1 } },
            resultOps: [{
              operation: 'updateTripValues',
              values: { number: 1 }
            }],
            scheduledActions: []
          };
        });

      const action = { name: 'add', params: {} };
      const actionContext = { scriptContent: {}, evaluateAt: now };

      const result = ActionCore.applyAction(action, actionContext);

      sinon.assert.calledOnce(ActionCore.applyEvent);
      sinon.assert.calledWith(ActionCore.applyEvent, { type: '123' });

      assert.deepStrictEqual(result.nextContext.evalContext, { number: 1 });
      assert.deepStrictEqual(result.resultOps, [{
        operation: 'event',
        event: { type: '123' }
      }, {
        operation: 'updateTripValues',
        values: { number: 1 }
      }]);
    });
  });

  describe('#applyEvent', () => {
    const actionContext = { scriptContent: {}, evaluateAt: now };

    it('returns nothing if no triggers', () => {
      sandbox.stub(TriggerEventCore, 'triggersForEvent').callsFake(() => {
        return [];
      });
      const event = { type: 'added' };
      const result = ActionCore.applyEvent(event, actionContext);

      assert.deepStrictEqual(result, {
        nextContext: actionContext,
        resultOps: [],
        scheduledActions: []
      });
    });

    it('returns trigger results if present', () => {
      const resultSentinel = {
        nextContext: {},
        resultOps: [{}],
        scheduledActions: []
      };
      const trigger = { name: 'trigger1' };
      sandbox.stub(TriggerEventCore, 'triggersForEvent').callsFake(() => {
        return [trigger];
      });
      sandbox.stub(ActionCore, 'applyTrigger')
        .callsFake(() => (resultSentinel));

      const event = { type: 'added' };
      const result = ActionCore.applyEvent(event, actionContext);

      assert.deepStrictEqual(result, resultSentinel);
      sinon.assert.calledWith(ActionCore.applyTrigger,
        trigger, event, actionContext, actionContext);
    });
  });

  describe('#applyOrScheduleAction', () => {
    const actionContext = { evaluateAt: now };

    it('applies action if scheduled immediately', () => {
      const action = { scheduleAt: now };
      const stubContext = {};
      sandbox.stub(ActionCore, 'applyAction').returns(stubContext);
      const result = ActionCore.applyOrScheduleAction(action, actionContext);

      assert.strictEqual(result, stubContext);
      sinon.assert.calledOnce(ActionCore.applyAction);
    });

    it('schedule action if scheduled in the future', () => {
      const unpackedAction = { 
        name: 'signal_cue',
        params: { cue_name: 'cue' },
        scheduleAt: now.clone().add(24, 'hours'),
        triggerName: '123',
        event: {}
      };
      sandbox.stub(ActionCore, 'applyAction').returns({});
      const result = ActionCore.applyOrScheduleAction(
        unpackedAction, actionContext);

      assert.deepStrictEqual(result, {
        nextContext: actionContext,
        resultOps: [],
        scheduledActions: [unpackedAction]
      });
      sinon.assert.notCalled(ActionCore.applyAction);
    });
  });

  describe('#applyTrigger', () => {
    const actionContext = { evalContext: {}, evaluateAt: now };

    it('returns history op even if no actions', () => {
      sandbox.stub(TriggerActionCore, 'unpackedActionsForTrigger').returns([]);

      const trigger = { name: 'trigger' };
      const event = { type: 'event' };
      const res = ActionCore.applyTrigger(trigger, event, actionContext,
        actionContext);

      assert.deepEqual(res.nextContext.evalContext, {
        history: { trigger: now.toISOString() },
      });
      assert.deepEqual(res.resultOps, [{
        operation: 'updateTripHistory',
        history: { trigger: now.toISOString() }
      }]);
    });

    it('returns immediate result', () => {
      sandbox.stub(TriggerActionCore, 'unpackedActionsForTrigger')
        .returns([{ name: 'add',  params: {}, scheduleAt: now }]);

      const trigger = { name: 'trigger' };
      const event = { type: 'event' };
      const res = ActionCore.applyTrigger(trigger, event,
        actionContext, actionContext);

      assert.deepEqual(res.nextContext.evalContext, {
        history: { trigger: now.toISOString() },
        number: 1
      });
      assert.deepEqual(res.resultOps, [{
        operation: 'updateTripHistory',
        history: { trigger: now.toISOString() }
      }, {
        operation: 'updateTripValues',
        values: { number: 1 }
      }]);
      assert.deepEqual(res.scheduledActions, []);
    });

    it('returns scheduled result', () => {
      const trigger = { name: 'trigger' };
      const event = { type: 'event' };
      const unpackedAction = {
        name: 'add',
        params: {},
        scheduleAt: now.clone().add(1, 'hours'),
        triggerName: 'trigger',
        event: event
      };
      sandbox.stub(TriggerActionCore, 'unpackedActionsForTrigger')
        .returns([unpackedAction]);

      const res = ActionCore.applyTrigger(trigger, event,
        actionContext, actionContext);

      assert.deepEqual(res.nextContext.evalContext, {
        history: { trigger: now.toISOString() }
      });
      assert.deepEqual(res.resultOps, [{
        operation: 'updateTripHistory',
        history: { trigger: now.toISOString() }
      }]);
      assert.deepStrictEqual(res.scheduledActions, [unpackedAction]);
    });
  });
});
