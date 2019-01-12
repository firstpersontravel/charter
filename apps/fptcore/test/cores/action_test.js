const _ = require('lodash');
const assert = require('assert');
const sinon = require('sinon');
const moment = require('moment');

const ActionCore = require('../../src/cores/action');
const ActionsRegistry = require('../../src/registries/actions');
const TriggerCore = require('../../src/cores/trigger');
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

  describe('#eventForAction', () => {
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
      const eventSentinel = {};
      sandbox.stub(ActionCore, 'eventForAction').returns(eventSentinel);
      sandbox.stub(ActionCore, 'applyEvent')
        .callsFake(function(event, actionContext) {
          return {
            nextContext: actionContext,
            resultOps: [{ operation: 'updateTripValues', values: {} }],
            scheduledActions: []
          };
        });

      const action = { name: 'add', params: {} };
      const actionContext = { scriptContent: {}, evaluateAt: now };

      const result = ActionCore.applyAction(action, actionContext);

      assert.deepStrictEqual(result.nextContext.evalContext, { number: 1 });
      assert.deepStrictEqual(result.resultOps, [{
        operation: 'updateTripValues',
        values: { number: 1 }
      }, {
        operation: 'updateTripValues',
        values: {}
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

  describe('#actionsForTrigger', () => {
    it('returns actions with added event and trigger info', () => {
      sandbox.stub(TriggerCore, 'actionsForTrigger').callsFake(() => {
        return [{ name: 'fake', params: {} }];
      });
      const trigger = { name: 'trigger' };
      const event = { type: 'event' };
      const actionContext = { evalContext: {} };

      const result = ActionCore.actionsForTrigger(trigger, event,
        actionContext);

      assert.deepStrictEqual(result, [{
        name: 'fake',
        params: {},
        triggerName: trigger.name,
        event: event
      }]);

      // Ensure TriggerCore.actionsForTrigger was called with the event
      // added to the context -- for when triggers have if statements
      // that depend on the contextual event.
      assert.deepStrictEqual(
        TriggerCore.actionsForTrigger.firstCall.args, [
          trigger,
          _.merge({}, actionContext, { evalContext: { event: event } })
        ]);
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
      const action = { name: 'signal_cue', params: {}, when: 'in 24h' };
      sandbox.stub(ActionCore, 'applyAction').returns({});
      const result = ActionCore.applyOrScheduleAction(action, actionContext);

      assert.deepStrictEqual(result, {
        nextContext: actionContext,
        resultOps: [],
        scheduledActions: [{
          name: action.name,
          params: action.params,
          when: 'in 24h',
          scheduleAt: now.clone().add(24, 'hours')
        }]
      });
      sinon.assert.notCalled(ActionCore.applyAction);
    });
  });

  describe('#applyTrigger', () => {
    const actionContext = { evalContext: {}, evaluateAt: now };

    it('returns history op even if no actions', () => {
      sandbox.stub(ActionCore, 'actionsForTrigger').returns([]);

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
      sandbox.stub(ActionCore, 'actionsForTrigger')
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
      const scheduledAction = {
        name: 'add',
        params: {},
        when: 'in 1h',
        triggerName: 'trigger',
        event: event
      };
      sandbox.stub(ActionCore, 'actionsForTrigger')
        .returns([scheduledAction]);

      const res = ActionCore.applyTrigger(trigger, event,
        actionContext, actionContext);

      assert.deepEqual(res.nextContext.evalContext, {
        history: { trigger: now.toISOString() }
      });
      assert.deepEqual(res.resultOps, [{
        operation: 'updateTripHistory',
        history: { trigger: now.toISOString() }
      }]);
      assert.deepStrictEqual(res.scheduledActions, [{
        name: scheduledAction.name,
        params: scheduledAction.params,
        when: 'in 1h',
        triggerName: scheduledAction.triggerName,
        event: scheduledAction.event,
        scheduleAt: now.clone().add(1, 'hours')
      }]);
    });
  });
});
