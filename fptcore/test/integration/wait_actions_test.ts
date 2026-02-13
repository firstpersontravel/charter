const assert = require('assert');
const sinon = require('sinon');
const moment = require('moment');

const Kernel = require('../../src/kernel/kernel').default;

const sandbox = sinon.sandbox.create();

const now = moment.utc();
const in1min = now.clone().add(1, 'minutes');

describe('Integration - Wait Actions', () => {
  afterEach(() => {
    sandbox.restore();
  });

  const event = { type: 'text_received', message: { from: 'A', to: 'B' } };
  const actionContext = {
    evalContext: {
      schedule: { t: now.clone().add(1, 'minutes').toISOString() }
    },
    evaluateAt: now
  };

  it('delays subsequent actions after wait action', () => {
    const trigger = {
      name: 'trigger1',
      event: { type: 'text_received', from: 'A', to: 'B' },
      actions: [
        { name: 'set_value', value_ref: 'a', new_value_ref: '10' },
        { name: 'wait', duration: '10s' },
        { name: 'set_value', value_ref: 'b', new_value_ref: '20' },
      ]
    };

    const result = Kernel.resultForTrigger(trigger, event, actionContext,
      actionContext);

    assert.deepStrictEqual(result, {
      nextContext: {
        evaluateAt: now,
        evalContext: {
          a: 10,
          history: { trigger1: now.toISOString() },
          schedule: { t: in1min.toISOString() }
        }
      },
      resultOps: [{
        operation: 'updateTripHistory',
        history: { trigger1: now.toISOString() }
      }, {
        operation: 'updateTripValues',
        values: { a: 10 }
      }],
      scheduledActions: [{
        name: 'set_value',
        params: { value_ref: 'b', new_value_ref: '20' },
        scheduleAt: now.clone().add(10, 'seconds').toDate(),
        event: event,
        triggerName: 'trigger1'
      }]
    });
  });

  it('delays subsequent actions after wait_before_time action', () => {
    const trigger = {
      name: 'trigger1',
      event: { type: 'text_received', from: 'A', to: 'B' },
      actions: [
        { name: 'set_value', value_ref: 'a', new_value_ref: '10' },
        { name: 'wait_before_time', until: 't', before: '10s' },
        { name: 'set_value', value_ref: 'b', new_value_ref: '20' },
      ]
    };

    const result = Kernel.resultForTrigger(trigger, event, actionContext,
      actionContext);

    assert.deepStrictEqual(result, {
      nextContext: {
        evaluateAt: now,
        evalContext: {
          a: 10,
          history: { trigger1: now.toISOString() },
          schedule: { t: in1min.toISOString() }
        }
      },
      resultOps: [{
        operation: 'updateTripHistory',
        history: { trigger1: now.toISOString() }
      }, {
        operation: 'updateTripValues',
        values: { a: 10 }
      }],
      scheduledActions: [{
        name: 'set_value',
        params: { value_ref: 'b', new_value_ref: '20' },
        scheduleAt: in1min.clone().subtract(10, 'seconds').toDate(),
        event: event,
        triggerName: 'trigger1'
      }]
    });
  });

  it('delays subsequent actions after wait_for_time action', () => {
    const trigger = {
      name: 'trigger1',
      event: { type: 'text_received', from: 'A', to: 'B' },
      actions: [
        { name: 'wait_for_time', until: 't' },
        { name: 'set_value', value_ref: 'b', new_value_ref: '20' }
      ]
    };

    const result = Kernel.resultForTrigger(trigger, event, actionContext,
      actionContext);

    assert.deepStrictEqual(result, {
      nextContext: {
        evaluateAt: now,
        evalContext: {
          history: { trigger1: now.toISOString() },
          schedule: { t: in1min.toISOString() }
        }
      },
      resultOps: [{
        operation: 'updateTripHistory',
        history: { trigger1: now.toISOString() }
      }],
      scheduledActions: [{
        name: 'set_value',
        params: { value_ref: 'b', new_value_ref: '20' },
        scheduleAt: in1min.toDate(),
        event: event,
        triggerName: 'trigger1'
      }]
    });
  });
});
