const assert = require('assert');

const increment_value = require('../../../src/modules/values/value_increment');

describe('#increment_value', () => {
  it('increments absent trip value', () => {
    const params = { value_ref: 'count' };
    const actionContext = { evalContext: {} };

    const res = increment_value.getOps(params, actionContext);

    assert.deepEqual(res, [{
      operation: 'updateTripValues',
      values: { count: 1 }
    }]);
  });

  it('increments trip value by 1 by default', () => {
    const params = { value_ref: 'count' };
    const actionContext = { evalContext: { count: 2 } };

    const res = increment_value.getOps(params, actionContext);

    assert.deepEqual(res, [{
      operation: 'updateTripValues',
      values: { count: 3 }
    }]);
  });

  it('increments trip value by number', () => {
    const params = { value_ref: 'count', delta: 10 };
    const actionContext = { evalContext: { count: 2 } };

    const res = increment_value.getOps(params, actionContext);

    assert.deepEqual(res, [{
      operation: 'updateTripValues',
      values: { count: 12 }
    }]);
  });

  it('increments trip value with period', () => {
    const params = { value_ref: 'cabana.monkeys', delta: 10 };
    const actionContext = { evalContext: { 'cabana.monkeys': 2 } };

    const res = increment_value.getOps(params, actionContext);

    assert.deepEqual(res, [{
      operation: 'updateTripValues',
      values: { 'cabana.monkeys': 12 }
    }]);
  });
});
