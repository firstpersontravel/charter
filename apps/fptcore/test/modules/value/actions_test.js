const assert = require('assert');

const valueActions = require('../../../src/modules/value/actions');

describe('#set_value', () => {
  it('sets player value to number', () => {
    const res = valueActions.set_value.applyAction(
      { content: { roles: [{ name: 'Gabe' }] } },
      { Gabe: {} },
      { value_ref: 'Gabe.monkeys', new_value_ref: 2 }, null);
    assert.deepEqual(res, [{
      operation: 'updatePlayer',
      roleName: 'Gabe',
      updates: { values: { monkeys: { $set: 2 } } }
    }]);
  });

  it('overwrites player value to number', () => {
    const res = valueActions.set_value.applyAction(
      { content: { roles: [{ name: 'Gabe' }] } },
      { Gabe: { monkeys: 6 } },
      { value_ref: 'Gabe.monkeys', new_value_ref: 2 }, null);
    assert.deepEqual(res, [{
      operation: 'updatePlayer',
      roleName: 'Gabe',
      updates: { values: { monkeys: { $set: 2 } } }
    }]);
  });

  it('overwrites player value to string', () => {
    const res = valueActions.set_value.applyAction(
      { content: { roles: [{ name: 'Gabe' }] } },
      { Gabe: { monkeys: 6 } },
      { value_ref: 'Gabe.monkeys', new_value_ref: '"hi"' }, null);
    assert.deepEqual(res, [{
      operation: 'updatePlayer',
      roleName: 'Gabe',
      updates: { values: { monkeys: { $set: 'hi' } } }
    }]);
  });

  it('overwrites player value to boolean', () => {
    const res = valueActions.set_value.applyAction(
      { content: { roles: [{ name: 'Gabe' }] } },
      { Gabe: { monkeys: 6 } },
      { value_ref: 'Gabe.monkeys', new_value_ref: false }, null);
    assert.deepEqual(res, [{
      operation: 'updatePlayer',
      roleName: 'Gabe',
      updates: { values: { monkeys: { $set: false } } }
    }]);
  });

  it('sets player value to value of other ref', () => {
    const res = valueActions.set_value.applyAction(
      { content: { roles: [{ name: 'Gabe' }] } },
      { Gabe: { monkeys: 6, bananas: 10 } },
      { value_ref: 'Gabe.monkeys', new_value_ref: 'Gabe.bananas' }, null);
    assert.deepEqual(res, [{
      operation: 'updatePlayer',
      roleName: 'Gabe',
      updates: { values: { monkeys: { $set: 10 } } }
    }]);
  });

  it('sets deep player value to const', () => {
    const res = valueActions.set_value.applyAction(
      { content: { roles: [{ name: 'Gabe' }] } }, {},
      { value_ref: 'Gabe.monkeys.num', new_value_ref: 'true' }, null);
    assert.deepEqual(res, [{
      operation: 'updatePlayer',
      roleName: 'Gabe',
      updates: { values: { monkeys: { num: { $set: true } } } }
    }]);
  });

  it('sets trip value to number', () => {
    const res = valueActions.set_value.applyAction(
      { content: { roles: [{ name: 'Gabe' }] } },
      { cabana: {} },
      { value_ref: 'cabana.monkeys', new_value_ref: 2 }, null);
    assert.deepEqual(res, [{
      operation: 'updateTrip',
      updates: { values: { cabana: { monkeys: { $set: 2 } } } }
    }]);
  });

  it('overwrites trip value to number', () => {
    const res = valueActions.set_value.applyAction(
      { content: { roles: [{ name: 'Gabe' }] } },
      { cabana: { monkeys: 6 } },
      { value_ref: 'cabana.monkeys', new_value_ref: 2 }, null);
    assert.deepEqual(res, [{
      operation: 'updateTrip',
      updates: { values: { cabana: { monkeys: { $set: 2 } } } }
    }]);
  });

  it('overwrites trip value to string', () => {
    const res = valueActions.set_value.applyAction(
      { content: { roles: [{ name: 'Gabe' }] } },
      { cabana: { monkeys: 6 } },
      { value_ref: 'cabana.monkeys', new_value_ref: '"hi"' }, null);
    assert.deepEqual(res, [{
      operation: 'updateTrip',
      updates: { values: { cabana: { monkeys: { $set: 'hi' } } } }
    }]);
  });

  it('overwrites trip value to boolean', () => {
    const res = valueActions.set_value.applyAction(
      { content: { roles: [{ name: 'Gabe' }] } },
      { cabana: { monkeys: 6 } },
      { value_ref: 'cabana.monkeys', new_value_ref: false }, null);
    assert.deepEqual(res, [{
      operation: 'updateTrip',
      updates: { values: { cabana: { monkeys: { $set: false } } } }
    }]);
  });

  it('sets trip value to value of other ref', () => {
    const res = valueActions.set_value.applyAction(
      { content: { roles: [{ name: 'Gabe' }] } },
      { cabana: { monkeys: 6, bananas: 10 } },
      { value_ref: 'cabana.monkeys', new_value_ref: 'cabana.bananas' },
      null);
    assert.deepEqual(res, [{
      operation: 'updateTrip',
      updates: { values: { cabana: { monkeys: { $set: 10 } } } }
    }]);
  });
});

describe('#increment_value', () => {
  it('increments absent player value by 1 by default', () => {
    const res = valueActions.increment_value.applyAction(
      { content: { roles: [{ name: 'Gabe' }] } },
      { Gabe: {} },
      { value_ref: 'Gabe.monkeys' }, null);
    assert.deepEqual(res, [{
      operation: 'updatePlayer',
      roleName: 'Gabe',
      updates: { values: { monkeys: { $set: 1 } } }
    }]);
  });

  it('increments player value by 1 by default', () => {
    const res = valueActions.increment_value.applyAction(
      { content: { roles: [{ name: 'Gabe' }] } },
      { Gabe: { monkeys: 2 } },
      { value_ref: 'Gabe.monkeys' }, null);
    assert.deepEqual(res, [{
      operation: 'updatePlayer',
      roleName: 'Gabe',
      updates: { values: { monkeys: { $set: 3 } } }
    }]);
  });

  it('increments player value by number', () => {
    const res = valueActions.increment_value.applyAction(
      { content: { roles: [{ name: 'Gabe' }] } },
      { Gabe: { monkeys: 2 } },
      { value_ref: 'Gabe.monkeys', delta: 10 }, null);
    assert.deepEqual(res, [{
      operation: 'updatePlayer',
      roleName: 'Gabe',
      updates: { values: { monkeys: { $set: 12 } } }
    }]);
  });

  it('increments absent trip value', () => {
    const res = valueActions.increment_value.applyAction(
      { content: { roles: [{ name: 'Gabe' }] } },
      {},
      { value_ref: 'cabana.monkeys' }, null);
    assert.deepEqual(res, [{
      operation: 'updateTrip',
      updates: { values: { cabana: { monkeys: { $set: 1 } } } }
    }]);
  });

  it('increments trip value by 1 by default', () => {
    const res = valueActions.increment_value.applyAction(
      { content: { roles: [{ name: 'Gabe' }] } },
      { cabana: { monkeys: 2 } },
      { value_ref: 'cabana.monkeys' }, null);
    assert.deepEqual(res, [{
      operation: 'updateTrip',
      updates: { values: { cabana: { monkeys: { $set: 3 } } } }
    }]);
  });

  it('increments trip value by number', () => {
    const res = valueActions.increment_value.applyAction(
      { content: { roles: [{ name: 'Gabe' }] } },
      { cabana: { monkeys: 2 } },
      { value_ref: 'cabana.monkeys', delta: 10 }, null);
    assert.deepEqual(res, [{
      operation: 'updateTrip',
      updates: { values: { cabana: { monkeys: { $set: 12 } } } }
    }]);
  });
});
