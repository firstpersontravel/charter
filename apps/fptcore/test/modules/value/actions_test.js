const assert = require('assert');

const valueActions = require('../../../src/modules/value/actions');

describe('#set_value', () => {
  it('sets trip value to number', () => {
    const res = valueActions.set_value.applyAction(
      { content: { roles: [{ name: 'Gabe' }] } },
      {}, { value_ref: 'cabana.monkeys', new_value_ref: 2 }, null);
    assert.deepEqual(res, [{
      operation: 'updateTripValues',
      values: { 'cabana.monkeys': 2 }
    }]);
  });

  it('overwrites trip value to number', () => {
    const res = valueActions.set_value.applyAction(
      { content: { roles: [{ name: 'Gabe' }] } },
      { 'cabana.monkeys': 6 },
      { value_ref: 'cabana.monkeys', new_value_ref: 2 }, null);
    assert.deepEqual(res, [{
      operation: 'updateTripValues',
      values: { 'cabana.monkeys': 2 }
    }]);
  });

  it('overwrites trip value to string', () => {
    const res = valueActions.set_value.applyAction(
      { content: { roles: [{ name: 'Gabe' }] } },
      { 'cabana.monkeys': 6 },
      { value_ref: 'cabana.monkeys', new_value_ref: '"hi"' }, null);
    assert.deepEqual(res, [{
      operation: 'updateTripValues',
      values: { 'cabana.monkeys': 'hi' }
    }]);
  });

  it('overwrites trip value to boolean', () => {
    const res = valueActions.set_value.applyAction(
      { content: { roles: [{ name: 'Gabe' }] } },
      { 'cabana.monkeys': 6 },
      { value_ref: 'cabana.monkeys', new_value_ref: false }, null);
    assert.deepEqual(res, [{
      operation: 'updateTripValues',
      values: { 'cabana.monkeys': false }
    }]);
  });

  it('sets trip value to value of other ref', () => {
    const res = valueActions.set_value.applyAction(
      { content: { roles: [{ name: 'Gabe' }] } },
      { 'cabana.monkeys': 6, 'cabana.bananas': 10 },
      { value_ref: 'cabana.monkeys', new_value_ref: 'cabana.bananas' },
      null);
    assert.deepEqual(res, [{
      operation: 'updateTripValues',
      values: { 'cabana.monkeys': 10 }
    }]);
  });
});

describe('#increment_value', () => {
  it('increments absent trip value', () => {
    const res = valueActions.increment_value.applyAction(
      { content: { roles: [{ name: 'Gabe' }] } },
      {},
      { value_ref: 'cabana.monkeys' }, null);
    assert.deepEqual(res, [{
      operation: 'updateTripValues',
      values: { 'cabana.monkeys': 1 }
    }]);
  });

  it('increments trip value by 1 by default', () => {
    const res = valueActions.increment_value.applyAction(
      { content: { roles: [{ name: 'Gabe' }] } },
      { 'cabana.monkeys': 2 },
      { value_ref: 'cabana.monkeys' }, null);
    assert.deepEqual(res, [{
      operation: 'updateTripValues',
      values: { 'cabana.monkeys': 3 }
    }]);
  });

  it('increments trip value by number', () => {
    const res = valueActions.increment_value.applyAction(
      { content: { roles: [{ name: 'Gabe' }] } },
      { 'cabana.monkeys': 2 },
      { value_ref: 'cabana.monkeys', delta: 10 }, null);
    assert.deepEqual(res, [{
      operation: 'updateTripValues',
      values: { 'cabana.monkeys': 12 }
    }]);
  });
});
