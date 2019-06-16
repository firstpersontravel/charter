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
    getOps(params, actionContext) {
      return [{
        operation: 'updateTripValues',
        values: { number: (actionContext.evalContext.number || 0) + 1 }
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

  describe('#opsForImmediateAction', () => {
    it('returns action ops', () => {
      const action = { name: 'add', params: {} };
      const actionContext = { scriptContent: {}, evaluateAt: now };

      const ops = ActionCore.opsForImmediateAction(action, actionContext);

      assert.deepStrictEqual(ops, [{
        operation: 'updateTripValues',
        values: { number: 1 }
      }]);
    });
  });

  describe('#addEventToContext', () => {
    it('adds event to context', () => {
      const event = { type: 'event' };
      const actionContext = { evalContext: { abc: '123' } };

      const result = ActionCore.addEventToContext(event, actionContext);

      assert.deepEqual(result.evalContext, { abc: '123', event: event });      
    });
  });

  describe('#resultForImmediateAction', () => {
    it('returns action results', () => {
      const action = { name: 'add', params: {} };
      const actionContext = { scriptContent: {}, evaluateAt: now };

      const result = ActionCore.resultForImmediateAction(action, actionContext);

      assert.deepStrictEqual(result.nextContext.evalContext, { number: 1 });
      assert.deepStrictEqual(result.resultOps, [{
        operation: 'updateTripValues',
        values: { number: 1 }
      }]);
    });

    it('returns action and subsequent event results', () => {
      sandbox.stub(ActionCore, 'opsForImmediateAction')
        .callsFake(function(action, actionContext) {
          return [{ operation: 'event', event: { type: '123' }}];
        });
      sandbox.stub(ActionCore, 'resultForEvent')
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

      const result = ActionCore.resultForImmediateAction(action, actionContext);

      sinon.assert.calledOnce(ActionCore.resultForEvent);
      sinon.assert.calledWith(ActionCore.resultForEvent, { type: '123' });

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

  describe('#resultForEvent', () => {
    const actionContext = { scriptContent: {}, evaluateAt: now };

    it('returns nothing if no triggers', () => {
      sandbox.stub(TriggerEventCore, 'triggersForEvent').callsFake(() => {
        return [];
      });
      const event = { type: 'added' };
      const result = ActionCore.resultForEvent(event, actionContext);

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
      sandbox.stub(ActionCore, 'resultForTrigger')
        .callsFake(() => (resultSentinel));

      const event = { type: 'added' };
      const result = ActionCore.resultForEvent(event, actionContext);

      assert.deepStrictEqual(result, resultSentinel);
      sinon.assert.calledWith(ActionCore.resultForTrigger,
        trigger, event, actionContext, actionContext);
    });
  });

  describe('#resultForFutureAction', () => {
    const actionContext = { evaluateAt: now };

    it('applies action if scheduled immediately', () => {
      const action = { scheduleAt: now };
      const stubContext = {};
      sandbox.stub(ActionCore, 'resultForImmediateAction').returns(stubContext);
      const result = ActionCore.resultForFutureAction(action, actionContext);

      assert.strictEqual(result, stubContext);
      sinon.assert.calledOnce(ActionCore.resultForImmediateAction);
    });

    it('schedule action if scheduled in the future', () => {
      const unpackedAction = { 
        name: 'signal_cue',
        params: { cue_name: 'cue' },
        scheduleAt: now.clone().add(24, 'hours'),
        triggerName: '123',
        event: {}
      };
      sandbox.stub(ActionCore, 'resultForImmediateAction').returns({});
      const result = ActionCore.resultForFutureAction(
        unpackedAction, actionContext);

      assert.deepStrictEqual(result, {
        nextContext: actionContext,
        resultOps: [],
        scheduledActions: [unpackedAction]
      });
      sinon.assert.notCalled(ActionCore.resultForImmediateAction);
    });
  });

  describe('#resultForTrigger', () => {
    const actionContext = { evalContext: {}, evaluateAt: now };

    it('returns history op even if no actions', () => {
      sandbox.stub(TriggerActionCore, 'unpackedActionsForTrigger').returns([]);

      const trigger = { name: 'trigger' };
      const event = { type: 'event' };
      const res = ActionCore.resultForTrigger(trigger, event, actionContext,
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
      const res = ActionCore.resultForTrigger(trigger, event,
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

      const res = ActionCore.resultForTrigger(trigger, event,
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
