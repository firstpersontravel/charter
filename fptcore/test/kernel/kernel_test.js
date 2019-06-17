const assert = require('assert');
const sinon = require('sinon');
const moment = require('moment');

const ActionsRegistry = require('../../src/registries/actions');
const Kernel = require('../../src/kernel/kernel');
const KernelActions = require('../../src/kernel/actions');
const KernelTriggers = require('../../src/kernel/triggers');

const sandbox = sinon.sandbox.create();

describe('Kernel', () => {
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

      const ops = Kernel.opsForImmediateAction(action, actionContext);

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

      const result = Kernel.addEventToContext(event, actionContext);

      assert.deepEqual(result.evalContext, { abc: '123', event: event });      
    });
  });

  describe('#resultForImmediateAction', () => {
    it('returns action results', () => {
      const action = { name: 'add', params: {} };
      const actionContext = { scriptContent: {}, evaluateAt: now };

      const result = Kernel.resultForImmediateAction(action, actionContext);

      assert.deepStrictEqual(result, {
        nextContext: Object.assign({}, actionContext, {
          evalContext: { number: 1 }
        }),
        waitingUntil: null,
        resultOps: [{
          operation: 'updateTripValues',
          values: { number: 1 }
        }],
        scheduledActions: []
      });
    });

    it('returns action and subsequent event results', () => {
      sandbox
        .stub(Kernel, 'opsForImmediateAction')
        .callsFake(function(action, actionContext) {
          return [{ operation: 'event', event: { type: '123' }}];
        });

      const action = { name: 'add', params: {} };
      const actionContext = { scriptContent: {}, evaluateAt: now };

      sandbox
        .stub(Kernel, 'resultForEvent')
        .callsFake(function(event, actionContext) {
          return {
            nextContext: Object.assign({}, actionContext, {
              evalContext: { number: 1 }
            }),
            waitingUntil: null,
            resultOps: [{
              operation: 'updateTripValues',
              values: { number: 1 }
            }],
            scheduledActions: []
          };
        });

      const result = Kernel.resultForImmediateAction(action, actionContext);

      sinon.assert.calledOnce(Kernel.resultForEvent);
      sinon.assert.calledWith(Kernel.resultForEvent, { type: '123' });

      assert.deepStrictEqual(result, {
        nextContext: Object.assign({}, actionContext, {
          evalContext: { number: 1 }
        }),
        waitingUntil: null,
        resultOps: [{
          operation: 'event',
          event: { type: '123' }
        }, {
          operation: 'updateTripValues',
          values: { number: 1 }
        }],
        scheduledActions: []
      });
    });
  });

  describe('#resultForEvent', () => {
    const actionContext = { scriptContent: {}, evaluateAt: now };

    it('returns nothing if no triggers', () => {
      sandbox.stub(KernelTriggers, 'triggersForEvent').callsFake(() => {
        return [];
      });
      const event = { type: 'added' };
      const result = Kernel.resultForEvent(event, actionContext);

      assert.deepStrictEqual(result, {
        nextContext: actionContext,
        waitingUntil: null,
        resultOps: [],
        scheduledActions: []
      });
    });

    it('returns trigger results if present', () => {
      const resultSentinel = {
        nextContext: {},
        waitingUntil: null,
        resultOps: [{}],
        scheduledActions: []
      };
      const trigger = { name: 'trigger1' };
      sandbox.stub(KernelTriggers, 'triggersForEvent').callsFake(() => {
        return [trigger];
      });
      sandbox.stub(Kernel, 'resultForTrigger')
        .callsFake(() => (resultSentinel));

      const event = { type: 'added' };
      const result = Kernel.resultForEvent(event, actionContext);

      assert.deepStrictEqual(result, resultSentinel);
      sinon.assert.calledWith(Kernel.resultForTrigger,
        trigger, event, actionContext, actionContext);
    });
  });

  describe('#resultForTriggeredAction', () => {
    const actionContext = { evaluateAt: now };

    it('applies action if scheduled immediately', () => {
      const action = { scheduleAt: now };
      const stubContext = {};
      sandbox.stub(Kernel, 'resultForImmediateAction').returns(stubContext);
      const result = Kernel.resultForTriggeredAction(action, actionContext);

      assert.strictEqual(result, stubContext);
      sinon.assert.calledOnce(Kernel.resultForImmediateAction);
    });

    it('schedule action if scheduled in the future', () => {
      const unpackedAction = { 
        name: 'signal_cue',
        params: { cue_name: 'cue' },
        scheduleAt: now.clone().add(24, 'hours'),
        triggerName: '123',
        event: {}
      };
      sandbox.stub(Kernel, 'resultForImmediateAction').returns({});
      const result = Kernel.resultForTriggeredAction(unpackedAction,
        actionContext);

      assert.deepStrictEqual(result, {
        nextContext: actionContext,
        waitingUntil: null,
        resultOps: [],
        scheduledActions: [unpackedAction]
      });
      sinon.assert.notCalled(Kernel.resultForImmediateAction);
    });
  });

  describe('#resultForTrigger', () => {
    const actionContext = { evalContext: {}, evaluateAt: now };

    it('returns history op even if no actions', () => {
      sandbox.stub(KernelActions, 'unpackedActionsForTrigger').returns([]);

      const trigger = { name: 'trigger' };
      const event = { type: 'event' };
      const result = Kernel.resultForTrigger(trigger, event, actionContext,
        actionContext);

      assert.deepStrictEqual(result, {
        nextContext: Object.assign({}, actionContext, {
          evalContext: {
            history: { trigger: now.toISOString() }
          }
        }),
        waitingUntil: null,
        resultOps: [{
          operation: 'updateTripHistory',
          history: { trigger: now.toISOString() }
        }],
        scheduledActions: []
      });
    });

    it('returns immediate result', () => {
      sandbox
        .stub(KernelActions, 'unpackedActionsForTrigger')
        .returns([{ name: 'add',  params: {}, scheduleAt: now }]);

      const trigger = { name: 'trigger' };
      const event = { type: 'event' };
      const result = Kernel.resultForTrigger(trigger, event,
        actionContext, actionContext);

      assert.deepStrictEqual(result, {
        nextContext: Object.assign({}, actionContext, {
          evalContext: {
            history: { trigger: now.toISOString() },
            number: 1
          }
        }),
        waitingUntil: null,
        resultOps: [{
          operation: 'updateTripHistory',
          history: { trigger: now.toISOString() }
        }, {
          operation: 'updateTripValues',
          values: { number: 1 }
        }],
        scheduledActions: []
      });
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
      sandbox
        .stub(KernelActions, 'unpackedActionsForTrigger')
        .returns([unpackedAction]);

      const result = Kernel.resultForTrigger(trigger, event,
        actionContext, actionContext);

      assert.deepStrictEqual(result, {
        nextContext: Object.assign({}, actionContext, {
          evalContext: { history: { trigger: now.toISOString() } }
        }),
        waitingUntil: null,
        resultOps: [{
          operation: 'updateTripHistory',
          history: { trigger: now.toISOString() }
        }],
        scheduledActions: [unpackedAction]
      });
    });
  });
});
