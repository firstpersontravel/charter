const assert = require('assert');
const sinon = require('sinon');
const moment = require('moment');

const ActionCore = require('../../src/action');
const Actions = require('../../src/actions');
const ActionValidationCore = require('../../src/action_validation');

var sandbox = sinon.sandbox.create();

const now = moment.utc();

describe('Integration - Message Triggers', () => {

  let actionSpies;

  beforeEach(() => {
    actionSpies = {};
    sandbox
      .stub(ActionValidationCore, 'getAction')
      .callsFake((name) => {
        if (!actionSpies[name]) {
          actionSpies[name] = sinon.spy(Actions[name].applyAction);
        }
        return Object.assign({}, Actions[name], {
          applyAction: actionSpies[name]
        });
      });
  });

  afterEach(() => {
    actionSpies = null;
    sandbox.restore();
  });

  it('messages only trigger triggers when conditionals match at start', () => {
    const script = {
      content: {
        triggers: [{
          name: 'trigger1',
          event: { message_sent: { from: 'A', to: 'B' } },
          actions: ['set_value trigger true']
        }, {
          name: 'trigger2',
          event: { message_sent: { from: 'A', to: 'B' } },
          if: ['trigger'],
          actions: ['set_value SHOULD_NOT_FIRE true']
        }]
      }
    };
    const event = { type: 'message_sent', message: { from: 'A', to: 'B' } };
    const result = ActionCore.applyEvent(script, {}, event, now);

    // Should not fire shouldn't be set
    assert.equal(result.nextContext.SHOULD_NOT_FIRE, undefined);
  });

  it('matches message event on contextual if statement', () => {
    const script = {
      content: {
        triggers: [{
          name: 'trigger1',
          event: { message_sent: { type: 'text' } },
          if: 'contains event.message.content "1234"',
          actions: ['set_value trigger true']
        }]
      }
    };
    const okEvent = {
      type: 'message_sent',
      message: {
        from: 'A',
        to: 'B',
        type: 'text',
        content: 'the code is 1234!'
      }
    };
    // Ok result should fire
    const hitResult = ActionCore.applyEvent(script, {}, okEvent, now);
    assert.equal(hitResult.nextContext.trigger, true);
  });

  it('skips non-matching message event on contextual if statement', () => {
    const script = {
      content: {
        triggers: [{
          name: 'trigger1',
          event: { message_sent: { type: 'text' } },
          if: 'contains event.message.content "1234"',
          actions: ['set_value trigger true']
        }]
      }
    };
    const missEvent = {
      type: 'message_sent',
      message: {
        from: 'A',
        to: 'B',
        type: 'text',
        content: 'the code is 3456!'
      }
    };
    // Ok result should fire
    const missResult = ActionCore.applyEvent(script, {}, missEvent, now);
    assert.equal(missResult.nextContext.trigger, undefined);
  });
});
