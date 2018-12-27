const assert = require('assert');
const sinon = require('sinon');
const moment = require('moment');

const ActionCore = require('../src/action');
const ActionValidationCore = require('../src/action_validation');
const TriggerCore = require('../src/trigger');
const TriggerEventCore = require('../src/trigger_event');

var sandbox = sinon.sandbox.create();

describe('ActionCore', () => {

  var getActionStub;
  var addAction = {
    applyAction: function(script, context, params, applyAt) {
      return [{
        operation: 'updateTripValues',
        values: { number: (context.number || 0) + 1 }
      }];
    }
  };

  var scriptSentinel = {};
  var now = moment.utc();

  beforeEach(() => {
    getActionStub = sandbox.stub(ActionValidationCore, 'getAction');
    getActionStub.withArgs('add').returns(addAction);
    // pause on validation for testing
    sandbox.stub(ActionValidationCore, 'validateActionAtRun').returns(null);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('#opsForAction', () => {
    it.skip('tbd');
  });

  describe('#eventForAction', () => {
    it.skip('tbd');
  });

  describe('#addEventToContext', () => {
    it('adds event to context', () => {
      const context = { abc: '123' };
      const event = { type: 'event' };
      const result = ActionCore.addEventToContext(context, event);
      assert.deepEqual(result, { abc: '123', event: event });      
    });
  });

  describe('#applyActionSimple', () => {
    it('returns action results', () => {
      const action = { name: 'add', params: {} };
      const result = ActionCore.applyAction(scriptSentinel, {}, action, now);

      assert.deepStrictEqual(result.nextContext, { number: 1 });
      assert.deepStrictEqual(result.resultOps, [{
        operation: 'updateTripValues',
        values: { number: 1 }
      }]);
    });
  });

  describe('#applyAction', () => {
    it('returns action results', () => {
      const action = { name: 'add', params: {} };
      const result = ActionCore.applyAction(scriptSentinel, {}, action, now);

      assert.deepStrictEqual(result.nextContext, { number: 1 });
      assert.deepStrictEqual(result.resultOps, [{
        operation: 'updateTripValues',
        values: { number: 1 }
      }]);
    });

    it('returns action and subsequent event results', () => {
      const eventSentinel = {};
      sandbox.stub(ActionCore, 'eventForAction').returns(eventSentinel);
      sandbox.stub(ActionCore, 'applyEvent')
        .callsFake(function(script, context, event, applyAt) {
          return {
            nextContext: context,
            resultOps: [{ operation: 'updateTripValues', values: {} }],
            scheduledActions: []
          };
        });

      const action = { name: 'add', params: {} };
      const result = ActionCore.applyAction(scriptSentinel, {}, action, now);

      assert.deepStrictEqual(result.nextContext, { number: 1 });
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

    it('returns nothing if no triggers', () => {
      const contextSentinel = {};
      sandbox.stub(TriggerEventCore, 'triggersForEvent').callsFake(() => {
        return [];
      });
      const event = { type: 'added' };
      const result = ActionCore.applyEvent(scriptSentinel, contextSentinel,
        event, now);

      assert.deepStrictEqual(result, {
        nextContext: contextSentinel,
        resultOps: [],
        scheduledActions: []
      });
    });

    it('returns trigger results if present', () => {
      const contextSentinel = {};
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
        .callsFake((
          script, triggerContext, currentContext, trigger,
          event, applyAt
        ) => {
          return resultSentinel;
        });

      const event = { type: 'added' };
      const result = ActionCore.applyEvent(scriptSentinel, contextSentinel,
        event, now);

      assert.deepStrictEqual(result, resultSentinel);
      sinon.assert.calledWith(ActionCore.applyTrigger,
        scriptSentinel, {}, {}, trigger, event, now);
    });
  });

  describe('#actionsForTriggerAndEvent', () => {
    it('returns actions with added event and trigger info', () => {
      sandbox.stub(TriggerCore, 'actionsForTrigger').callsFake(() => {
        return [{ name: 'fake', params: {} }];
      });
      const trigger = { name: 'trigger' };
      const event = { type: 'event' };
      const contextWithEvent = { event: event };
      const result = ActionCore.actionsForTriggerAndEvent(
        trigger, contextWithEvent, event, now);

      assert.deepStrictEqual(result, [{
        name: 'fake',
        params: {},
        triggerName: trigger.name,
        event: event
      }]);
      assert.deepStrictEqual(
        TriggerCore.actionsForTrigger.firstCall.args,
        [trigger, contextWithEvent, now]);
    });
  });

  describe('#applyOrScheduleAction', () => {
    it('applies action if scheduled immediately', () => {
      const action = { scheduleAt: now };
      const resultSentinel = {};
      sandbox.stub(ActionCore, 'applyAction').returns(resultSentinel);
      const result = ActionCore.applyOrScheduleAction(scriptSentinel,
        {}, action, now);

      assert.strictEqual(result, resultSentinel);
      sinon.assert.calledOnce(ActionCore.applyAction);
    });

    it('schedule action if scheduled in the future', () => {
      const action = { scheduleAt: now.clone().add(1, 'days') };
      sandbox.stub(ActionCore, 'applyAction').returns({});
      const result = ActionCore.applyOrScheduleAction(scriptSentinel,
        {}, action, now);

      assert.deepEqual(result, {
        nextContext: {},
        resultOps: [],
        scheduledActions: [action]
      });
      sinon.assert.notCalled(ActionCore.applyAction);
    });
  });

  describe('#applyTrigger', () => {

    it('returns history op even if no actions', () => {
      sandbox.stub(ActionCore, 'actionsForTriggerAndEvent').returns([]);

      const contextSentinel = {};
      const trigger = { name: 'trigger' };
      const event = { type: 'event' };
      const res = ActionCore.applyTrigger(scriptSentinel, contextSentinel,
        contextSentinel, trigger, event, now);

      assert.deepEqual(res.nextContext, {
        history: { trigger: now.toISOString() },
      });
      assert.deepEqual(res.resultOps, [{
        operation: 'updateTripHistory',
        history: { trigger: now.toISOString() }
      }]);
    });

    it('returns immediate result', () => {
      sandbox.stub(ActionCore, 'actionsForTriggerAndEvent')
        .returns([{ name: 'add',  params: {}, scheduleAt: now }]);

      const contextSentinel = {};
      const trigger = { name: 'trigger' };
      const event = { type: 'event' };
      const res = ActionCore.applyTrigger(scriptSentinel, contextSentinel,
        contextSentinel, trigger, event, now);

      assert.deepEqual(res.nextContext, {
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
        scheduleAt: now.clone().add(1, 'hours'),
        triggerName: 'trigger',
        event: event
      };
      sandbox.stub(ActionCore, 'actionsForTriggerAndEvent')
        .returns([scheduledAction]);

      const contextSentinel = {};
      const res = ActionCore.applyTrigger(scriptSentinel, contextSentinel,
        contextSentinel, trigger, event, now);

      assert.deepEqual(res.nextContext, {
        history: { trigger: now.toISOString() }
      });
      assert.deepEqual(res.resultOps, [{
        operation: 'updateTripHistory',
        history: { trigger: now.toISOString() }
      }]);
      assert.deepStrictEqual(res.scheduledActions, [scheduledAction]);
    });
  });
});
