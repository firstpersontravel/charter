const assert = require('assert');
const sinon = require('sinon');

const ActionValidationCore = require('../../src/cores/action_validation');

const sandbox = sinon.sandbox.create();

describe('ActionValidationCore', () => {
  afterEach(() => {
    sandbox.restore();
  });

  describe('#checkAction', () => {

    beforeEach(() => {
      sandbox.stub(ActionValidationCore, 'getAction');
    });

    it('warns on invalid action', () => {
      const action = { name: 'invalid', params: {} };
      const result = ActionValidationCore.checkAction({}, action);
      assert.deepStrictEqual(result, ['Invalid action "invalid".']);
    });

    it('warns on missing required param', () => {
      const dummyAction = function() {};
      dummyAction.params = { number: { required: true, type: 'number' } };
      ActionValidationCore.getAction.returns(dummyAction);

      const action = { name: 'dummy', params: {} };
      const result = ActionValidationCore.checkAction({}, action);
      assert.deepStrictEqual(result, ['Required param "number" not present.']);
    });

    it('does not warn on missing optional param', () => {
      const dummyAction = function() {};
      dummyAction.params = { number: { required: false, type: 'number' } };
      ActionValidationCore.getAction.returns(dummyAction);

      const action = { name: 'dummy', params: {} };
      const result = ActionValidationCore.checkAction({}, action);
      assert.deepStrictEqual(result, []);
    });

    it('warns on unexpected param', () => {
      const dummyAction = function() {};
      dummyAction.params = { number: { required: true, type: 'number' } };
      ActionValidationCore.getAction.returns(dummyAction);

      const action = { name: 'dummy', params: { number: 1, extra: 2 } };
      const result = ActionValidationCore.checkAction({}, action);
      assert.deepStrictEqual(result, ['Unexpected param "extra" (expected one of: number).']);
    });
  });

  describe('#precheckAction', () => {

    beforeEach(() => {
      sandbox.stub(ActionValidationCore, 'getAction');
      // Ignore check since we test that separately.
      sandbox.stub(ActionValidationCore, 'checkAction').returns([]);
    });

    it('warns on mismatched required context and trigger event', () => {
      const dummyAction = function() {};
      dummyAction.requiredContext = ['dummy_event_type'];
      ActionValidationCore.getAction.returns(dummyAction);

      const trigger = { event: { other_type: { param: 'value' } } };
      const action = { name: 'dummy', params: { number: 1, extra: 2 } };
      const result = ActionValidationCore.precheckAction({}, action, trigger);
      assert.deepStrictEqual(result, [
        'Required context "dummy_event_type" not present.'
      ]);
    });

    it('passes if required context matches trigger', () => {
      const dummyAction = function() {};
      dummyAction.requiredContext = ['dummy_event_type'];
      ActionValidationCore.getAction.returns(dummyAction);

      const trigger = { event: { dummy_event_type: { param: 'value' } } };
      const action = { name: 'dummy', params: { number: 1, extra: 2 } };
      const result = ActionValidationCore.precheckAction({}, action, trigger);
      assert.deepStrictEqual(result, []);
    });
  });

  describe('#validateActionAtRun', () => {
    beforeEach(() => {
      sandbox.stub(ActionValidationCore, 'getAction');
      // Ignore check since we test that separately.
      sandbox.stub(ActionValidationCore, 'checkAction').returns([]);
    });

    it('throws on mismatched required context and event', () => {
      const dummyAction = function() {};
      dummyAction.requiredContext = ['dummy_event_type'];
      ActionValidationCore.getAction.returns(dummyAction);

      const context = { event: { type: 'another_type' } };
      const action = { name: 'dummy', params: { number: 1, extra: 2 } };
      assert.throws(() => {
        ActionValidationCore.validateActionAtRun({}, context, action);
      }, err => (
        err.message === 'Error validating "dummy": Required context "dummy_event_type" but executed with event "another_type".'
      ));
    });

    it('throws on missing required context', () => {
      const dummyAction = function() {};
      dummyAction.requiredContext = ['dummy_event_type'];
      ActionValidationCore.getAction.returns(dummyAction);

      const context = { event: null };
      const action = { name: 'dummy', params: { number: 1, extra: 2 } };
      assert.throws(() => {
        ActionValidationCore.validateActionAtRun({}, context, action);
      }, err => (
        err.message === 'Error validating "dummy": Required context "dummy_event_type" but executed without event.'
      ));
    });

    it('passes if required context matches event', () => {
      const dummyAction = function() {};
      dummyAction.requiredContext = ['dummy_event_type'];
      ActionValidationCore.getAction.returns(dummyAction);

      const context = { event: { type: 'dummy_event_type' } };
      const action = { name: 'dummy', params: { number: 1, extra: 2 } };
      assert.doesNotThrow(() => {
        ActionValidationCore.validateActionAtRun({}, context, action);
      });
    });
  });
});
