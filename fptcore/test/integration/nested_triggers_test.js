const _ = require('lodash');
const assert = require('assert');
const sinon = require('sinon');
const moment = require('moment');

const coreRegistry = require('../../src/core-registry');
const Kernel = require('../../src/kernel/kernel');

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
      event: { type: 'cue_signaled', cue: 'CUE-PICK-APPLES' },
      actions: [{ name: 'increment_value', value_ref: 'apples', delta: 5 }],
    }, {
      name: 'TRIGGER-UNLOAD-APPLES',
      event: {
        type: 'geofence_entered',
        role: 'Farmer',
        geofence: 'GEOFENCE-FARM'
      },
      actions: [{ name: 'set_value', value_ref: 'apples', new_value_ref: '0' }]
    }, {
      name: 'TRIGGER-SUNRISE',
      event: { type: 'cue_signaled', cue: 'CUE-SUNRISE' },
      actions: [{
        name: 'wait',
        duration: '120m'
      }, {
        name: 'send_audio',
        from_role_name: 'Rooster',
        to_role_name: 'Farmer',
        content: 'crow.mp3'
      }]
    }, {
      name: 'TRIGGER-GREET-1',
      event: { type: 'cue_signaled', cue: 'CUE-GREET' },
      actions: [{ name: 'signal_cue', cue_name: 'CUE-GREET-REPLY' }]
    }, {
      name: 'TRIGGER-GREET-2',
      event: { type: 'cue_signaled', cue: 'CUE-GREET-REPLY' },
      actions: [{
        name: 'send_text',
        from_role_name: 'Cowboy',
        to_role_name: 'Farmer',
        content: 'howdy'
      }]
    }, {
      name: 'TRIGGER-NAV-1',
      event: { type: 'cue_signaled', cue: 'CUE-NAV-1' },
      actions: [{
        name: 'set_value',
        value_ref: 'is_navigating',
        new_value_ref: 'true'
      }, {
        name: 'signal_cue',
        cue_name: 'CUE-NAV-2'
      }]
    }, {
      name: 'TRIGGER-NAV-2',
      event: { type: 'cue_signaled', cue: 'CUE-NAV-2' },
      if: { op: 'value_is_true', ref: 'is_navigating' },
      actions: [{
        name: 'send_text',
        from_role_name: 'Cowboy',
        to_role_name: 'Farmer',
        content: 'geewhiz'
      }]
    }],
    scenes: [{ name: 'MAIN' }],
    pages: [
      { name: 'TRACTOR', scene: 'MAIN' },
      { name: 'BACK-HOME', scene: 'MAIN' }
    ],
    geofences: [{ name: 'GEOFENCE-FARM' }]
  },
  evalContext: {
    tripState: {
      currentSceneName: '',
      currentPageNamesByRole: { Farmer: 'TRACTOR' }
    },
    apples: 2
  },
  evaluateAt: now
};

describe('Integration - Nested Triggers', () => {

  beforeEach(() => {
    const oldActions = Object.assign({}, coreRegistry.actions);
    const spyActions = ['send_text', 'signal_cue', 'send_to_page'];
    spyActions.forEach((spyAction) => {
      sandbox
        .stub(coreRegistry.actions, spyAction)
        .value(Object.assign({}, coreRegistry.actions[spyAction], {
          getOps: sinon.spy(oldActions[spyAction].getOps)
        }));
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('applies page change', () => {
    const unpackedAction = {
      name: 'send_to_page',
      params: { role_name: 'Farmer', page_name: 'BACK-HOME' }
    };
    const result = Kernel.resultForImmediateAction(unpackedAction, actionContext);

    assert.deepStrictEqual(
      result.nextContext.evalContext.tripState.currentPageNamesByRole,
      { Farmer: 'BACK-HOME' });
    assert.deepStrictEqual(result.resultOps, [{
      operation: 'updateTripFields',
      fields: {
        tripState: {
          currentSceneName: '',
          currentPageNamesByRole: { Farmer: 'BACK-HOME' }
        }
      }
    }]);
  });

  it('applies cue triggering action immediately', () => {
    const unpackedAction = {
      name: 'signal_cue',
      params: { cue_name: 'CUE-PICK-APPLES' }
    };

    const result = Kernel.resultForImmediateAction(unpackedAction, actionContext);

    assert.strictEqual(result.nextContext.evalContext.apples, 7);
    assert.deepStrictEqual(result.resultOps, [{
      operation: 'event',
      event: { type: 'cue_signaled', cue: 'CUE-PICK-APPLES' }
    }, {
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

    const result = Kernel.resultForEvent(event, actionContext);

    assert.deepStrictEqual(result, {
      nextContext: Object.assign({}, actionContext, {
        evalContext: Object.assign({}, actionContext.evalContext, {
          apples: 0,
          history: { 'TRIGGER-UNLOAD-APPLES': now.toISOString() } 
        })
      }),
      resultOps: [{
        operation: 'updateTripHistory',
        history: { 'TRIGGER-UNLOAD-APPLES': now.toISOString() } 
      }, {
        operation: 'updateTripValues',
        values: { apples: 0 }
      }],
      scheduledActions: []
    });
  });

  it('applies cue triggering action later', () => {
    const inTwoHours = now.clone().add(2, 'hours');
    const unpackedAction = {
      name: 'signal_cue',
      params: { cue_name: 'CUE-SUNRISE' }
    };

    const result = Kernel.resultForImmediateAction(unpackedAction, actionContext);

    assert.deepStrictEqual(result, {
      nextContext: Object.assign({}, actionContext, {
        evalContext: Object.assign({}, actionContext.evalContext, {
          apples: 2,
          history: { 'TRIGGER-SUNRISE': now.toISOString() }
        })
      }),
      resultOps: [{
        operation: 'event',
 
        event: { type: 'cue_signaled', cue: 'CUE-SUNRISE' }
      }, {
        operation: 'updateTripHistory',
        history: { 'TRIGGER-SUNRISE': now.toISOString() }
      }],
      scheduledActions: [{
        name: 'send_audio',
        params: {
          from_role_name: 'Rooster',
          to_role_name: 'Farmer',
          content: 'crow.mp3'
        },
        scheduleAt: inTwoHours.toDate(),
        triggerName: 'TRIGGER-SUNRISE',
        event: { type: 'cue_signaled', cue: 'CUE-SUNRISE' }
      }]
    });
  });

  it('applies nested triggers', () => {
    const unpackedAction = {
      name: 'signal_cue',
      params: { cue_name: 'CUE-GREET' }
    };

    const result = Kernel.resultForImmediateAction(unpackedAction, actionContext);

    // Test intermediate action calls
    // First cue should have been called with no event
    sinon.assert.calledWith(
      coreRegistry.actions.signal_cue.getOps.getCall(0),
      { cue_name: 'CUE-GREET' },
      _.merge({}, actionContext, { evalContext: { event: null } }));

    // Second cue should have been called with the event 'cue CUE-GREET',
    sinon.assert.calledWith(
      coreRegistry.actions.signal_cue.getOps.getCall(1),
      { cue_name: 'CUE-GREET-REPLY' },
      _.merge({}, actionContext, {
        evalContext: {
          event: { cue: 'CUE-GREET', type: 'cue_signaled' },
          history: { 'TRIGGER-GREET-1': now.toISOString() }
        }
      }));

    // Then send_text with event 'cue CUE-GREET-REPLY'
    sinon.assert.calledWith(coreRegistry.actions.send_text.getOps.getCall(0),
      { from_role_name: 'Cowboy', to_role_name: 'Farmer', content: 'howdy' },
      _.merge({}, actionContext, {
        evalContext: {
          event: { cue: 'CUE-GREET-REPLY', type: 'cue_signaled' },
          history: {
            'TRIGGER-GREET-1': now.toISOString(),
            'TRIGGER-GREET-2': now.toISOString()
          }
        }
      })
    );

    // Test results
    assert.deepStrictEqual(result.resultOps, [{
      operation: 'event',
      event: { type: 'cue_signaled', cue: 'CUE-GREET' }
    }, {
      operation: 'updateTripHistory',
      history: { 'TRIGGER-GREET-1': now.toISOString() }
    }, {
      operation: 'event',
      event: { type: 'cue_signaled', cue: 'CUE-GREET-REPLY' }
    }, {
      operation: 'updateTripHistory',
      history: { 'TRIGGER-GREET-2': now.toISOString() }
    }, {
      operation: 'createMessage',
      fields: {
        medium: 'text',
        content: 'howdy',
        createdAt: now,
        fromRoleName: 'Cowboy',
        toRoleName: 'Farmer',
        isReplyNeeded: false
      },
      suppressRelayId: null
    }, {
      operation: 'event',
      event: {
        type: 'text_received',
        content: 'howdy',
        from: 'Cowboy',
        to: 'Farmer',
        message: { content: 'howdy' }
      }
    }]);
  });

  it('applies nested triggers requiring intermediate context', () => {
    const unpackedAction = {
      name: 'signal_cue',
      params: { cue_name: 'CUE-NAV-1' }
    };

    const result = Kernel.resultForImmediateAction(unpackedAction, actionContext);

    assert.deepStrictEqual(result.resultOps, [{
      operation: 'event',
      event: { type: 'cue_signaled', cue: 'CUE-NAV-1' }
    }, {
      operation: 'updateTripHistory',
      history: { 'TRIGGER-NAV-1': now.toISOString() }
    }, {
      operation: 'updateTripValues',
      values: { is_navigating: true }
    }, {
      operation: 'event',
      event: { type: 'cue_signaled', cue: 'CUE-NAV-2' }
    }, {
      operation: 'updateTripHistory',
      history: { 'TRIGGER-NAV-2': now.toISOString() }
    }, {
      operation: 'createMessage',
      fields: {
        medium: 'text',
        content: 'geewhiz',
        createdAt: now,
        fromRoleName: 'Cowboy',
        toRoleName: 'Farmer',
        isReplyNeeded: false
      },
      suppressRelayId: null
    }, {
      operation: 'event',
      event: {
        type: 'text_received',
        content: 'geewhiz',
        from: 'Cowboy',
        to: 'Farmer',
        message: { content: 'geewhiz' }
      }
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
          event: { type: 'cue_signaled', cue: 'end-of-1' },
          scene: 'SCENE-1',
          actions: [{ name: 'start_scene', scene_name: 'SCENE-2' }]
        }, {
          name: 'trigger2',
          event: { type: 'scene_started' },
          scene: 'SCENE-2',
          actions: [{
            name: 'set_value',
            value_ref: 'val',
            new_value_ref: 'true'
          }]
        }]
      },
      evalContext: { tripState: { currentSceneName: 'SCENE-1' } },
      evaluateAt: now
    };
    const event = { type: 'cue_signaled', cue: 'end-of-1' };

    const result = Kernel.resultForEvent(event, sceneActionContext);

    assert.deepStrictEqual(result.nextContext.evalContext, {
      tripState: {
        currentSceneName: 'SCENE-2',
        currentPageNamesByRole: {}
      },
      history: { trigger1: now.toISOString(), trigger2: now.toISOString() },
      val: true
    });
  });
});
