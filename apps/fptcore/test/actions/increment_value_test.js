const assert = require('assert');

const incrementValue = require('../../src/actions/increment_value');

describe('#incrementValue', () => {

  it('increments absent player value by 1 by default', () => {
    const res = incrementValue({ content: { roles: [{ name: 'Gabe' }] } },
      { Gabe: {} },
      { value_ref: 'Gabe.monkeys' }, null);
    assert.deepEqual(res, [{
      operation: 'updateParticipant',
      roleName: 'Gabe',
      updates: { values: { monkeys: { $set: 1 } } }
    }]);
  });

  it('increments player value by 1 by default', () => {
    const res = incrementValue({ content: { roles: [{ name: 'Gabe' }] } },
      { Gabe: { monkeys: 2 } },
      { value_ref: 'Gabe.monkeys' }, null);
    assert.deepEqual(res, [{
      operation: 'updateParticipant',
      roleName: 'Gabe',
      updates: { values: { monkeys: { $set: 3 } } }
    }]);
  });

  it('increments player value by number', () => {
    const res = incrementValue({ content: { roles: [{ name: 'Gabe' }] } },
      { Gabe: { monkeys: 2 } },
      { value_ref: 'Gabe.monkeys', delta: 10 }, null);
    assert.deepEqual(res, [{
      operation: 'updateParticipant',
      roleName: 'Gabe',
      updates: { values: { monkeys: { $set: 12 } } }
    }]);
  });

  it('increments absent trip value', () => {
    const res = incrementValue({ content: { roles: [{ name: 'Gabe' }] } },
      {},
      { value_ref: 'cabana.monkeys' }, null);
    assert.deepEqual(res, [{
      operation: 'updateTrip',
      updates: { values: { cabana: { monkeys: { $set: 1 } } } }
    }]);
  });

  it('increments trip value by 1 by default', () => {
    const res = incrementValue({ content: { roles: [{ name: 'Gabe' }] } },
      { cabana: { monkeys: 2 } },
      { value_ref: 'cabana.monkeys' }, null);
    assert.deepEqual(res, [{
      operation: 'updateTrip',
      updates: { values: { cabana: { monkeys: { $set: 3 } } } }
    }]);
  });

  it('increments trip value by number', () => {
    const res = incrementValue({ content: { roles: [{ name: 'Gabe' }] } },
      { cabana: { monkeys: 2 } },
      { value_ref: 'cabana.monkeys', delta: 10 }, null);
    assert.deepEqual(res, [{
      operation: 'updateTrip',
      updates: { values: { cabana: { monkeys: { $set: 12 } } } }
    }]);
  });
});
