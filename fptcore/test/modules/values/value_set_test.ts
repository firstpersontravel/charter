const assert = require('assert');

const set_value = require('../../../src/modules/values/value_set').default;

describe('#set_value', () => {
  it('sets trip value to number', () => {
    const params = { value_ref: 'count', new_value_ref: 2 };
    const actionContext = {
      evalContext: {}
    };

    const res = set_value.getOps(params, actionContext);

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

    const res = set_value.getOps(params, actionContext);

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

    const res = set_value.getOps(params, actionContext);

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

    const res = set_value.getOps(params, actionContext);

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

    const res = set_value.getOps(params, actionContext);

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

    const res = set_value.getOps(params, actionContext);

    assert.deepEqual(res, [{
      operation: 'updateTripValues',
      values: { count: 10 }
    }]);
  });
});
