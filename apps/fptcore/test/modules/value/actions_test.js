const assert = require('assert');

const valueActions = require('../../../src/modules/value/actions');

describe('#set_value', () => {
  it('sets trip value to number', () => {
    const params = { value_ref: 'count', new_value_ref: 2 };
    const actionContext = {
      evalContext: {}
    };

    const res = valueActions.set_value.applyAction(params, actionContext);

    assert.deepEqual(res, [{
      operation: 'updateTripValues',
      values: { count: 2 }
    }]);
  });

  it('overwrites trip value to number', () => {
    const params = { value_ref: 'count', new_value_ref: 2 };
    const actionContext = {
      evalContext: { count: 6 }
    };

    const res = valueActions.set_value.applyAction(params, actionContext);

    assert.deepEqual(res, [{
      operation: 'updateTripValues',
      values: { count: 2 }
    }]);
  });

  it('overwrites trip value to string', () => {
    const params = { value_ref: 'count', new_value_ref: '"hi"' };
    const actionContext = {
      evalContext: { count: 6 }
    };

    const res = valueActions.set_value.applyAction(params, actionContext);

    assert.deepEqual(res, [{
      operation: 'updateTripValues',
      values: { count: 'hi' }
    }]);
  });

  it('overwrites trip value to boolean', () => {
    const params = { value_ref: 'count', new_value_ref: false };
    const actionContext = {
      evalContext: { count: 6 }
    };

    const res = valueActions.set_value.applyAction(params, actionContext);

    assert.deepEqual(res, [{
      operation: 'updateTripValues',
      values: { count: false }
    }]);
  });

  it('sets trip value to value of other ref', () => {
    const params = {
      value_ref: 'count',
      new_value_ref: 'cabana.bananas'
    };
    const actionContext = {
      evalContext: { count: 6, 'cabana.bananas': 10 }
    };

    const res = valueActions.set_value.applyAction(params, actionContext);

    assert.deepEqual(res, [{
      operation: 'updateTripValues',
      values: { count: 10 }
    }]);
  });

  it('sets trip value to value of deeply nested ref', () => {
    const params = {
      value_ref: 'count',
      new_value_ref: 'cabana.bananas'
    };
    const actionContext = {
      evalContext: { cabana: { bananas: 10 } }
    };

    const res = valueActions.set_value.applyAction(params, actionContext);

    assert.deepEqual(res, [{
      operation: 'updateTripValues',
      values: { count: 10 }
    }]);
  });
});

describe('#increment_value', () => {
  it('increments absent trip value', () => {
    const params = { value_ref: 'count' };
    const actionContext = { evalContext: {} };

    const res = valueActions.increment_value.applyAction(
      params, actionContext);

    assert.deepEqual(res, [{
      operation: 'updateTripValues',
      values: { count: 1 }
    }]);
  });

  it('increments trip value by 1 by default', () => {
    const params = { value_ref: 'count' };
    const actionContext = { evalContext: { count: 2 } };

    const res = valueActions.increment_value.applyAction(
      params, actionContext);

    assert.deepEqual(res, [{
      operation: 'updateTripValues',
      values: { count: 3 }
    }]);
  });

  it('increments trip value by number', () => {
    const params = { value_ref: 'count', delta: 10 };
    const actionContext = { evalContext: { count: 2 } };

    const res = valueActions.increment_value.applyAction(
      params, actionContext);

    assert.deepEqual(res, [{
      operation: 'updateTripValues',
      values: { count: 12 }
    }]);
  });

  it('increments trip value with period', () => {
    const params = { value_ref: 'cabana.monkeys', delta: 10 };
    const actionContext = { evalContext: { 'cabana.monkeys': 2 } };

    const res = valueActions.increment_value.applyAction(
      params, actionContext);

    assert.deepEqual(res, [{
      operation: 'updateTripValues',
      values: { 'cabana.monkeys': 12 }
    }]);
  });
});
