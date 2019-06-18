const assert = require('assert');
const sinon = require('sinon');
const moment = require('moment');

const Kernel = require('../../src/kernel/kernel');
const KernelActions = require('../../src/kernel/actions');
const KernelTriggers = require('../../src/kernel/triggers');

const sandbox = sinon.sandbox.create();

const now = moment.utc();

const baseStubActions = {
  add: {
    getOps(params, actionContext) {
      const numPlus1 = (actionContext.evalContext.number || 0) + 1;
      return [{ operation: 'updateTripValues', values: { number: numPlus1 } }];
    }
  }
};

describe('Kernel', () => {
  let stubActions;

  beforeEach(() => {
    stubActions = Object.assign({}, baseStubActions);
    sandbox
      .stub(Kernel, 'getActionClass')
      .callsFake(name => stubActions[name]);
  });

  afterEach(() => {
    sandbox.restore();
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

  describe('#resultForTrigger', () => {
    const trigger = { name: 'trigger' };
    const event = { type: 'event' };
    const actionContext = { evalContext: {}, evaluateAt: now };

    it('returns history op even if no actions', () => {
      sandbox.stub(KernelActions, 'unpackedActionsForTrigger').returns([]);

      const result = Kernel.resultForTrigger(trigger, event, actionContext,
        actionContext);

      assert.deepStrictEqual(result, {
        nextContext: Object.assign({}, actionContext, {
          evalContext: {
            history: { trigger: now.toISOString() }
          }
        }),
        resultOps: [{
          operation: 'updateTripHistory',
          history: { trigger: now.toISOString() }
        }],
        scheduledActions: []
      });
    });

    it('returns immediate result', () => {
      sandbox.stub(KernelActions, 'unpackedActionsForTrigger').returns([
        { name: 'add',  params: {}, scheduleAt: now }
      ]);

      const result = Kernel.resultForTrigger(trigger,
        event, actionContext, actionContext);

      assert.deepStrictEqual(result, {
        nextContext: Object.assign({}, actionContext, {
          evalContext: {
            history: { trigger: now.toISOString() },
            number: 1
          }
        }),
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
      const in1Hour = now.clone().add(1, 'hours');
      sandbox.stub(KernelActions, 'unpackedActionsForTrigger').returns([
        { name: 'add', params: {}, scheduleAt: in1Hour }
      ]);

      const result = Kernel.resultForTrigger(trigger, event, actionContext, 
        actionContext);

      assert.deepStrictEqual(result, {
        nextContext: Object.assign({}, actionContext, {
          evalContext: { history: { trigger: now.toISOString() } }
        }),
        resultOps: [{
          operation: 'updateTripHistory',
          history: { trigger: now.toISOString() }
        }],
        scheduledActions: [{ name: 'add', params: {}, scheduleAt: in1Hour }]
      });
    });

    it('returns result scheduled by wait with absolute time', () => {
      stubActions.waitUntil1Hour = {
        getOps(params, actionContext) {
          const in1Hour = actionContext.evaluateAt.clone().add(1, 'hour');
          return [{ operation: 'wait', until: in1Hour }];
        }
      };
      sandbox.stub(KernelActions, 'unpackedActionsForTrigger').returns([
        { name: 'waitUntil1Hour', params: {}, scheduleAt: now },
        { name: 'add', params: {}, scheduleAt: now },
      ]);

      const result = Kernel.resultForTrigger(trigger, event, actionContext,
        actionContext);

      assert.deepStrictEqual(result, {
        nextContext: Object.assign({}, actionContext, {
          evalContext: { history: { trigger: now.toISOString() } }
        }),
        resultOps: [{
          operation: 'updateTripHistory',
          history: { trigger: now.toISOString() }
        }],
        scheduledActions: [{
          name: 'add',
          params: {},
          scheduleAt: now.clone().add(1, 'hours')
        }]
      });
    });

    it('returns result scheduled by waits with relative times', () => {
      stubActions.wait20SecsRelative = {
        getOps(params, actionContext) {
          return [{ operation: 'wait', seconds: 20 }];
        }
      };
      sandbox.stub(KernelActions, 'unpackedActionsForTrigger').returns([
        { name: 'wait20SecsRelative', params: {}, scheduleAt: now },
        { name: 'wait20SecsRelative', params: {}, scheduleAt: now },
        { name: 'add', params: {}, scheduleAt: now }
      ]);

      const result = Kernel.resultForTrigger(trigger, event, actionContext,
        actionContext);

      assert.deepStrictEqual(result, {
        nextContext: Object.assign({}, actionContext, {
          evalContext: { history: { trigger: now.toISOString() } }
        }),
        resultOps: [{
          operation: 'updateTripHistory',
          history: { trigger: now.toISOString() }
        }],
        scheduledActions: [{
          name: 'add',
          params: {},
          scheduleAt: now.clone().add(40, 'seconds')
        }]
      });
    });

    it('returns result scheduled by relative and absolute waits', () => {
      stubActions.waitUntil1Hour = {
        getOps(params, actionContext) {
          const in1Hour = actionContext.evaluateAt.clone().add(1, 'hour');
          return [{ operation: 'wait', until: in1Hour }];
        }
      };
      stubActions.wait20SecsRelative = {
        getOps(params, actionContext) {
          return [{ operation: 'wait', seconds: 20 }];
        }
      };
      sandbox.stub(KernelActions, 'unpackedActionsForTrigger').returns([
        { name: 'wait20SecsRelative', params: {}, scheduleAt: now },
        { name: 'add', params: {}, scheduleAt: now },
        { name: 'waitUntil1Hour', params: {}, scheduleAt: now },
        { name: 'wait20SecsRelative', params: {}, scheduleAt: now },
        { name: 'add', params: {}, scheduleAt: now }
      ]);

      const result = Kernel.resultForTrigger(trigger, event, actionContext, 
        actionContext);

      assert.deepStrictEqual(result, {
        nextContext: Object.assign({}, actionContext, {
          evalContext: { history: { trigger: now.toISOString() } }
        }),
        resultOps: [{
          operation: 'updateTripHistory',
          history: { trigger: now.toISOString() }
        }],
        scheduledActions: [{
          name: 'add',
          params: {},
          scheduleAt: now.clone().add(20, 'seconds')
        }, {
          name: 'add',
          params: {},
          scheduleAt: now.clone().add(1, 'hour').add(20, 'seconds')
        }]
      });
    });
  });
});
