const assert = require('assert');
const sinon = require('sinon');
const moment = require('moment');

const Kernel = require('../../src/kernel/kernel').default;

var sandbox = sinon.sandbox.create();

const now = moment.utc();

describe('Integration - Message Triggers', () => {
  afterEach(() => {
    sandbox.restore();
  });

  it('messages only trigger triggers when conditionals match at start', () => {
    const actionContext = {
      scriptContent: {
        triggers: [{
          name: 'trigger1',
          event: { type: 'text_received', from: 'A', to: 'B' },
          actions: [{
            name: 'set_value', 
            value_ref: 'trigger',
            new_value_ref: 'true'
          }]
        }, {
          name: 'trigger2',
          event: { type: 'text_received', from: 'A', to: 'B' },
          if: { op: 'value_is_true', ref: 'trigger' },
          actions: [{
            name: 'set_value',
            value_ref: 'SHOULD_NOT_FIRE',
            new_value_ref: 'true'
          }]
        }]
      },
      evalContext: {},
      evaluateAt: now
    };
    const event = { type: 'text_received', message: { from: 'A', to: 'B' } };
    const result = Kernel.resultForEvent(event, actionContext);

    // Should not fire shouldn't be set
    assert.equal(result.nextContext.evalContext.SHOULD_NOT_FIRE, undefined);
  });

  it('matches message event on contextual if statement', () => {
    const actionContext = {
      scriptContent: {
        triggers: [{
          name: 'trigger1',
          event: { type: 'text_received' },
          if: {
            op: 'value_contains',
            string_ref: 'event.content',
            part_ref: '"1234"'
          },
          actions: [{
            name: 'set_value',
            value_ref: 'trigger',
            new_value_ref: 'true'
          }]
        }]
      },
      evalContext: {},
      evaluateAt: now
    };
    const okEvent = {
      type: 'text_received',
      from: 'A',
      to: 'B',
      content: 'the code is 1234!'
    };
    // Ok result should fire
    const hitResult = Kernel.resultForEvent(okEvent, actionContext);
    assert.equal(hitResult.nextContext.evalContext.trigger, true);
  });

  it('skips non-matching message event on contextual if statement', () => {
    const actionContext = {
      scriptContent: {
        triggers: [{
          name: 'trigger1',
          event: { type: 'text_received' },
          if: {
            op: 'value_contains',
            string_ref: 'event.content',
            part_ref: '"1234"'
          },
          actions: [{
            name: 'set_value',
            value_ref: 'trigger',
            new_value_ref: 'true'
          }]
        }]
      },
      evalContext: {},
      evaluateAt: now
    };
    const missEvent = {
      type: 'text_received',
      from: 'A',
      to: 'B',
      content: 'the code is 3456!'
    };
    // Ok result should fire
    const missResult = Kernel.resultForEvent(missEvent, actionContext);
    assert.equal(missResult.nextContext.evalContext.trigger, undefined);
  });
});
