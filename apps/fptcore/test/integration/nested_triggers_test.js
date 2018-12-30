const _ = require('lodash');
const assert = require('assert');
const sinon = require('sinon');
const moment = require('moment');

const ActionCore = require('../../src/cores/action');
const ActionsRegistry = require('../../src/registries/actions');

var sandbox = sinon.sandbox.create();

const now = moment.utc();

const actionContext = {
  scriptContent: {
    roles: [
      { name: 'Farmer' },
      { name: 'Rooster' },
      { name: 'Cowboy' }
    ],
    cues: [
      { name: 'CUE-PICK-APPLES', scene: 'MAIN' },
      { name: 'CUE-SUNRISE', scene: 'MAIN' },
      { name: 'CUE-GREET', scene: 'MAIN' },
      { name: 'CUE-GREET-REPLY', scene: 'MAIN' },
      { name: 'CUE-NAV-1', scene: 'MAIN' },
      { name: 'CUE-NAV-2', scene: 'MAIN' }
    ],
    triggers: [{
      name: 'TRIGGER-PICK-APPLES',
      events: [{ cue_signaled: 'CUE-PICK-APPLES' }],
      actions: ['increment_value apples 5']
    }, {
      name: 'TRIGGER-UNLOAD-APPLES',
      events: [{
        geofence_entered: { role: 'Farmer', geofence: 'GEOFENCE-FARM' }
      }],
      actions: ['set_value apples 0']
    }, {
      name: 'TRIGGER-SUNRISE',
      events: [{ cue_signaled: 'CUE-SUNRISE' }],
      actions: ['in 120m, send_message MESSAGE-CROW']
    }, {
      name: 'TRIGGER-GREET-1',
      events: [{ cue_signaled: 'CUE-GREET' }],
      actions: ['signal_cue CUE-GREET-REPLY']
    }, {
      name: 'TRIGGER-GREET-2',
      events: [{ cue_signaled: 'CUE-GREET-REPLY' }],
      actions: ['custom_message Cowboy Farmer text howdy']
    }, {
      name: 'TRIGGER-NAV-1',
      events: [{ cue_signaled: 'CUE-NAV-1' }],
      actions: [
        'set_value is_navigating true',
        'signal_cue CUE-NAV-2'
      ]
    }, {
      name: 'TRIGGER-NAV-2',
      events: [{ cue_signaled: 'CUE-NAV-2' }],
      if: 'is_navigating',
      actions: ['custom_message Cowboy Farmer text geewhiz']
    }],
    scenes: [{ name: 'MAIN' }],
    pages: [
      { name: 'TRACTOR', scene: 'MAIN' },
      { name: 'BACK-HOME', scene: 'MAIN' }
    ],
    geofences: [{ name: 'GEOFENCE-FARM' }],
    messages: [{
      name: 'MESSAGE-CROW',
      type: 'text',
      from: 'Rooster',
      to: 'Farmer',
      content: 'cock-a-doodle-doo!'
    }]
  },
  evalContext: {
    Farmer: { id: 1, page: 'TRACTOR' },
    Rooster: { id: 2 },
    Cowboy: { id: 3 },
    apples: 2
  },
  evaluateAt: now
};

describe('Integration - Nested Triggers', () => {

  beforeEach(() => {
    const oldActions = Object.assign({}, ActionsRegistry);
    const spyActions = ['custom_message', 'signal_cue', 'send_to_page'];
    spyActions.forEach((spyAction) => {
      sandbox
        .stub(ActionsRegistry, spyAction)
        .value(Object.assign({}, ActionsRegistry[spyAction], {
          applyAction: sinon.spy(oldActions[spyAction].applyAction)
        }));
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('applies page change', () => {
    const action = {
      name: 'send_to_page',
      params: { role_name: 'Farmer', page_name: 'BACK-HOME' }
    };
    const result = ActionCore.applyAction(action, actionContext);

    assert.strictEqual(result.nextContext.evalContext.Farmer.currentPageName,
      'BACK-HOME');
    assert.deepStrictEqual(result.resultOps, [{
      operation: 'updatePlayerFields',
      roleName: 'Farmer',
      fields: { currentPageName: 'BACK-HOME' }
    }]);
  });

  it('applies cue triggering action immediately', () => {
    const action = {
      name: 'signal_cue',
      params: { cue_name: 'CUE-PICK-APPLES' }
    };

    const result = ActionCore.applyAction(action, actionContext);

    assert.strictEqual(result.nextContext.evalContext.apples, 7);
    assert.deepStrictEqual(result.resultOps, [{
      operation: 'updateTripHistory',
      history: { 'TRIGGER-PICK-APPLES': now.toISOString() }
    }, {
      operation: 'updateTripValues',
      values: { apples: 7 }
    }]);
  });

  it('applies geofence triggering action immediately', () => {
    const event = {
      type: 'geofence_entered',
      role: 'Farmer',
      geofence: 'GEOFENCE-FARM'
    };

    const result = ActionCore.applyEvent(event, actionContext);

    assert.strictEqual(result.nextContext.evalContext.apples, 0);
    assert.deepStrictEqual(result.resultOps, [{
      operation: 'updateTripHistory',
      history: { 'TRIGGER-UNLOAD-APPLES': now.toISOString() } 
    }, {
      operation: 'updateTripValues',
      values: { apples: 0 }
    }]);
  });

  it('applies cue triggering action later', () => {
    const inTwoHours = now.clone().add(2, 'hours');
    const action = { name: 'signal_cue', params: { cue_name: 'CUE-SUNRISE' } };

    const result = ActionCore.applyAction(action, actionContext);

    assert.strictEqual(result.nextContext.evalContext.apples, 2);
    assert.deepStrictEqual(result.resultOps, [{
      operation: 'updateTripHistory',
      history: { 'TRIGGER-SUNRISE': now.toISOString() }
    }]);
    assert.strictEqual(result.scheduledActions.length, 1);
    assert.strictEqual(result.scheduledActions[0].name, 'send_message');
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
    const action = { name: 'signal_cue', params: { cue_name: 'CUE-GREET' } };

    const result = ActionCore.applyAction(action, actionContext);

    // Test intermediate action calls
    // First cue should have been called with no event
    assert.deepStrictEqual(
      ActionsRegistry.signal_cue.applyAction.firstCall.args, [
        { cue_name: 'CUE-GREET' },
        _.merge({}, actionContext, { evalContext: { event: null } })
      ]);

    // Second cue should have been called with the event 'cue CUE-GREET',
    assert.deepStrictEqual(
      ActionsRegistry.signal_cue.applyAction.secondCall.args, [
        { cue_name: 'CUE-GREET-REPLY' },
        _.merge({}, actionContext, {
          evalContext: {
            event: { cue: 'CUE-GREET', type: 'cue_signaled' },
            history: { 'TRIGGER-GREET-1': now.toISOString() }
          }
        })]);

    // Then custom_message with event 'cue CUE-GREET-REPLY'
    assert.deepStrictEqual(
      ActionsRegistry.custom_message.applyAction.firstCall.args, [
        {
          from_role_name: 'Cowboy',
          to_role_name: 'Farmer',
          message_content: 'howdy',
          message_type: 'text'
        },
        _.merge({}, actionContext, {
          evalContext: {
            event: { cue: 'CUE-GREET-REPLY', type: 'cue_signaled' },
            history: {
              'TRIGGER-GREET-1': now.toISOString(),
              'TRIGGER-GREET-2': now.toISOString()
            }
          }
        })]);

    // Test results
    assert.deepStrictEqual(result.resultOps,
      [{
        operation: 'updateTripHistory',
        history: { 'TRIGGER-GREET-1': now.toISOString() }
      }, {
        operation: 'updateTripHistory',
        history: { 'TRIGGER-GREET-2': now.toISOString() }
      }, {
        operation: 'createMessage',
        fields: {
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
    const action = { name: 'signal_cue', params: { cue_name: 'CUE-NAV-1' } };

    const result = ActionCore.applyAction(action, actionContext);

    assert.deepStrictEqual(result.resultOps,
      [{
        operation: 'updateTripHistory',
        history: { 'TRIGGER-NAV-1': now.toISOString() }
      }, {
        operation: 'updateTripValues',
        values: { is_navigating: true }
      }, {
        operation: 'updateTripHistory',
        history: { 'TRIGGER-NAV-2': now.toISOString() }
      }, {
        operation: 'createMessage',
        fields: {
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

  it('applies scene start cues after start_scene event', () => {
    const sceneActionContext = {
      scriptContent: {
        scenes: [{
          name: 'SCENE-1'
        }, {
          name: 'SCENE-2'
        }],
        triggers: [{
          name: 'trigger1',
          events: [{ cue_signaled: 'end-of-1' }],
          scene: 'SCENE-1',
          actions: ['start_scene SCENE-2']
        }, {
          name: 'trigger2',
          events: [{ scene_started: 'SCENE-2' }],
          scene: 'SCENE-2',
          actions: ['set_value val true']
        }]
      },
      evalContext: { currentSceneName: 'SCENE-1' },
      evaluateAt: now
    };
    const event = { type: 'cue_signaled', cue: 'end-of-1' };

    const result = ActionCore.applyEvent(event, sceneActionContext);

    assert.deepStrictEqual(result.nextContext.evalContext, {
      currentSceneName: 'SCENE-2',
      history: { trigger1: now.toISOString(), trigger2: now.toISOString() },
      val: true
    });
  });
});
