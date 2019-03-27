const assert = require('assert');
const sinon = require('sinon');
const moment = require('moment');

const ActionCore = require('../../src/cores/action');

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
          events: [{ type: 'message_sent', from: 'A', to: 'B' }],
          actions: [{
            name: 'set_value', 
            value_ref: 'trigger',
            new_value_ref: 'true'
          }]
        }, {
          name: 'trigger2',
          events: [{ type: 'message_sent', from: 'A', to: 'B' }],
          if: ['trigger'],
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
    const event = { type: 'message_sent', message: { from: 'A', to: 'B' } };
    const result = ActionCore.applyEvent(event, actionContext);

    // Should not fire shouldn't be set
    assert.equal(result.nextContext.evalContext.SHOULD_NOT_FIRE, undefined);
  });

  it('matches message event on contextual if statement', () => {
    const actionContext = {
      scriptContent: {
        triggers: [{
          name: 'trigger1',
          events: [{ type: 'message_sent', medium: 'text' }],
          if: 'contains event.message.content "1234"',
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
      type: 'message_sent',
      message: {
        from: 'A',
        to: 'B',
        medium: 'text',
        content: 'the code is 1234!'
      }
    };
    // Ok result should fire
    const hitResult = ActionCore.applyEvent(okEvent, actionContext);
    assert.equal(hitResult.nextContext.evalContext.trigger, true);
  });

  it('skips non-matching message event on contextual if statement', () => {
    const actionContext = {
      scriptContent: {
        triggers: [{
          name: 'trigger1',
          events: [{ type: 'message_sent', medium: 'text' }],
          if: 'contains event.message.content "1234"',
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
      type: 'message_sent',
      message: {
        from: 'A',
        to: 'B',
        medium: 'text',
        content: 'the code is 3456!'
      }
    };
    // Ok result should fire
    const missResult = ActionCore.applyEvent(missEvent, actionContext);
    assert.equal(missResult.nextContext.evalContext.trigger, undefined);
  });
});
