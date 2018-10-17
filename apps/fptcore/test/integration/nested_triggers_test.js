const assert = require('assert');
const sinon = require('sinon');
const moment = require('moment');

const ActionCore = require('../../src/action');
const Actions = require('../../src/actions');
const ActionValidationCore = require('../../src/action_validation');

var sandbox = sinon.sandbox.create();

const script = {
  content: {
    roles: [{
      name: 'Farmer'
    }, {
      name: 'Rooster'
    }, {
      name: 'Cowboy'
    }],
    triggers: [{
      name: 'TRIGGER-PICK-APPLES',
      event: { cue_signaled: 'CUE-PICK-APPLES' },
      actions: ['increment_value Farmer.apples 5']
    }, {
      name: 'TRIGGER-UNLOAD-APPLES',
      event: {
        geofence_entered: { role: 'Farmer', geofence: 'GEOFENCE-FARM' }
      },
      actions: ['set_value Farmer.apples 0']
    }, {
      name: 'TRIGGER-SUNRISE',
      event: { cue_signaled: 'CUE-SUNRISE' },
      actions: ['in 120m, auto_message MESSAGE-CROW']
    }, {
      name: 'TRIGGER-GREET-1',
      event: { cue_signaled: 'CUE-GREET' },
      actions: ['cue CUE-GREET-REPLY']
    }, {
      name: 'TRIGGER-GREET-2',
      event: { cue_signaled: 'CUE-GREET-REPLY' },
      actions: ['custom_message Cowboy Farmer text howdy']
    }, {
      name: 'TRIGGER-NAV-1',
      event: { cue_signaled: 'CUE-NAV-1' },
      actions: [
        'set_value is_navigating true',
        'cue CUE-NAV-2'
      ]
    }, {
      name: 'TRIGGER-NAV-2',
      event: { cue_signaled: 'CUE-NAV-2' },
      if: 'is_navigating',
      actions: ['custom_message Cowboy Farmer text geewhiz']
    }],
    pages: [{
      name: 'TRACTOR'
    }, {
      name: 'BACK-HOME'
    }],
    geofences: [{
      name: 'GEOFENCE-FARM'
    }],
    messages: [{
      name: 'MESSAGE-CROW',
      type: 'text',
      from: 'Rooster',
      to: 'Farmer',
      content: 'cock-a-doodle-doo!'
    }]
  }
};

const context = {
  Farmer: {
    id: 1,
    page: 'TRACTOR',
    apples: 2
  },
  Rooster: {
    id: 2
  },
  Cowboy: {
    id: 3
  }
};

const now = moment.utc();

describe('Integration - Nested Triggers', () => {

  let actionSpies;

  beforeEach(() => {
    actionSpies = {};
    sandbox
      .stub(ActionValidationCore, 'getAction')
      .callsFake((name) => {
        if (!actionSpies[name]) {
          actionSpies[name] = sinon.spy(Actions[name]);
        }
        return actionSpies[name];
      });
  });

  afterEach(() => {
    actionSpies = null;
    sandbox.restore();
  });

  it('applies page change', () => {
    const action = {
      name: 'send_to_page',
      params: { role_name: 'Farmer', page_name: 'BACK-HOME' }
    };
    const result = ActionCore.applyAction(script, context, action, now);

    assert.strictEqual(result.nextContext.Farmer.currentPageName, 'BACK-HOME');
    assert.deepStrictEqual(result.resultOps, [{
      operation: 'updateParticipant',
      roleName: 'Farmer',
      updates: { currentPageName: { $set: 'BACK-HOME' } }
    }]);
  });

  it('applies cue triggering action immediately', () => {
    const action = { name: 'cue', params: { cue_name: 'CUE-PICK-APPLES' } };
    const result = ActionCore.applyAction(script, context, action, now);

    assert.strictEqual(result.nextContext.Farmer.apples, 7);
    assert.deepStrictEqual(result.resultOps, [{
      operation: 'updatePlaythrough',
      updates: {
        history: { 'TRIGGER-PICK-APPLES': { $set: now.toISOString() } } 
      }
    }, {
      operation: 'updateParticipant',
      roleName: 'Farmer',
      updates: { values: { apples: { $set: 7 } } }
    }]);
  });

  it('applies geofence triggering action immediately', () => {
    const event = {
      type: 'geofence_entered',
      role: 'Farmer',
      geofence: 'GEOFENCE-FARM'
    };
    const result = ActionCore.applyEvent(script, context, event, now);

    assert.strictEqual(result.nextContext.Farmer.apples, 0);
    assert.deepStrictEqual(result.resultOps, [{
      operation: 'updatePlaythrough',
      updates: {
        history: { 'TRIGGER-UNLOAD-APPLES': { $set: now.toISOString() } } 
      }
    }, {
      operation: 'updateParticipant',
      roleName: 'Farmer',
      updates: { values: { apples: { $set: 0 } } }
    }]);
  });

  it('applies cue triggering action later', () => {
    const inTwoHours = now.clone().add(2, 'hours');
    const action = { name: 'cue', params: { cue_name: 'CUE-SUNRISE' } };
    const result = ActionCore.applyAction(script, context, action, now);

    assert.strictEqual(result.nextContext.Farmer.apples, 2);
    assert.deepStrictEqual(result.resultOps, [{
      operation: 'updatePlaythrough',
      updates: {
        history: { 'TRIGGER-SUNRISE': { $set: now.toISOString() } } 
      }
    }]);
    assert.strictEqual(result.scheduledActions.length, 1);
    assert.strictEqual(result.scheduledActions[0].name, 'auto_message');
    assert.deepStrictEqual(result.scheduledActions[0].params, {
      message_name: 'MESSAGE-CROW'
    });
    assert(result.scheduledActions[0].scheduleAt.isSame(inTwoHours));
    assert.strictEqual(result.scheduledActions[0].triggerName,
      'TRIGGER-SUNRISE');
    assert.deepStrictEqual(result.scheduledActions[0].event, {
      type: 'cue_signaled',
      cue: 'CUE-SUNRISE'
    });
  });

  it('applies nested triggers', () => {
    const action = { name: 'cue', params: { cue_name: 'CUE-GREET' } };
    const result = ActionCore.applyAction(script, context, action, now);

    // Test intermediate action calls
    // First cue should have been called with no event
    assert(actionSpies.cue);
    assert.deepStrictEqual(actionSpies.cue.firstCall.args, [
      script,
      Object.assign({}, context, { event: null }),
      { cue_name: 'CUE-GREET' },
      now
    ]);
    // Second cue should have been called with the event 'cue CUE-GREET',
    assert.deepStrictEqual(actionSpies.cue.secondCall.args, [
      script,
      Object.assign({}, context, {
        event: {
          cue: 'CUE-GREET',
          type: 'cue_signaled'
        },
        history: {
          'TRIGGER-GREET-1': now.toISOString()
        }
      }),
      { cue_name: 'CUE-GREET-REPLY' },
      now
    ]);
    // Then custom_message with event 'cue CUE-GREET-REPLY'
    assert(actionSpies.custom_message);
    assert.deepStrictEqual(actionSpies.custom_message.firstCall.args, [
      script,
      Object.assign({}, context, {
        event: {
          cue: 'CUE-GREET-REPLY',
          type: 'cue_signaled'
        },
        history: {
          'TRIGGER-GREET-1': now.toISOString(),
          'TRIGGER-GREET-2': now.toISOString()
        }
      }),
      {
        from_role_name: 'Cowboy',
        to_role_name: 'Farmer',
        message_content: 'howdy',
        message_type: 'text'
      },
      now
    ]);

    // Test results
    assert.deepStrictEqual(result.resultOps,
      [{
        operation: 'updatePlaythrough',
        updates: {
          history: { 'TRIGGER-GREET-1': { $set: now.toISOString() } } 
        }
      }, {
        operation: 'updatePlaythrough',
        updates: {
          history: { 'TRIGGER-GREET-2': { $set: now.toISOString() } } 
        }
      }, {
        operation: 'createMessage',
        updates: {
          messageType: 'text',
          messageContent: 'howdy',
          createdAt: now,
          sentById: 3,
          sentToId: 1,
          sentFromLatitude: null,
          sentFromLongitude: null,
          sentFromAccuracy: null,
          isReplyNeeded: false,
          isInGallery: false
        },
        suppressRelayId: null
      }]);
  });

  it('applies nested triggers requiring intermediate context', () => {
    const action = { name: 'cue', params: { cue_name: 'CUE-NAV-1' } };
    const result = ActionCore.applyAction(script, context, action, now);

    assert.deepStrictEqual(result.resultOps,
      [{
        operation: 'updatePlaythrough',
        updates: {
          history: { 'TRIGGER-NAV-1': { $set: now.toISOString() } } 
        }
      }, {
        operation: 'updatePlaythrough',
        updates: {
          values: { is_navigating: { $set: true } }
        }
      }, {
        operation: 'updatePlaythrough',
        updates: {
          history: { 'TRIGGER-NAV-2': { $set: now.toISOString() } } 
        }
      }, {
        operation: 'createMessage',
        updates: {
          messageType: 'text',
          messageContent: 'geewhiz',
          createdAt: now,
          sentById: 3,
          sentToId: 1,
          sentFromLatitude: null,
          sentFromLongitude: null,
          sentFromAccuracy: null,
          isReplyNeeded: false,
          isInGallery: false
        },
        suppressRelayId: null
      }]);
  });
});
