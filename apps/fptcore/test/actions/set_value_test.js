const assert = require('assert');

const setValue = require('../../src/actions/set_value');

describe('#setValue', () => {
  it('sets player value to number', () => {
    const res = setValue({ content: { roles: [{ name: 'Gabe' }] } },
      { Gabe: {} },
      { value_ref: 'Gabe.monkeys', new_value_ref: 2 }, null);
    assert.deepEqual(res, [{
      operation: 'updatePlayer',
      roleName: 'Gabe',
      updates: { values: { monkeys: { $set: 2 } } }
    }]);
  });

  it('overwrites player value to number', () => {
    const res = setValue({ content: { roles: [{ name: 'Gabe' }] } },
      { Gabe: { monkeys: 6 } },
      { value_ref: 'Gabe.monkeys', new_value_ref: 2 }, null);
    assert.deepEqual(res, [{
      operation: 'updatePlayer',
      roleName: 'Gabe',
      updates: { values: { monkeys: { $set: 2 } } }
    }]);
  });

  it('overwrites player value to string', () => {
    const res = setValue({ content: { roles: [{ name: 'Gabe' }] } },
      { Gabe: { monkeys: 6 } },
      { value_ref: 'Gabe.monkeys', new_value_ref: '"hi"' }, null);
    assert.deepEqual(res, [{
      operation: 'updatePlayer',
      roleName: 'Gabe',
      updates: { values: { monkeys: { $set: 'hi' } } }
    }]);
  });

  it('overwrites player value to boolean', () => {
    const res = setValue({ content: { roles: [{ name: 'Gabe' }] } },
      { Gabe: { monkeys: 6 } },
      { value_ref: 'Gabe.monkeys', new_value_ref: false }, null);
    assert.deepEqual(res, [{
      operation: 'updatePlayer',
      roleName: 'Gabe',
      updates: { values: { monkeys: { $set: false } } }
    }]);
  });

  it('sets player value to value of other ref', () => {
    const res = setValue({ content: { roles: [{ name: 'Gabe' }] } },
      { Gabe: { monkeys: 6, bananas: 10 } },
      { value_ref: 'Gabe.monkeys', new_value_ref: 'Gabe.bananas' }, null);
    assert.deepEqual(res, [{
      operation: 'updatePlayer',
      roleName: 'Gabe',
      updates: { values: { monkeys: { $set: 10 } } }
    }]);
  });

  it('sets deep player value to const', () => {
    const res = setValue({ content: { roles: [{ name: 'Gabe' }] } }, {},
      { value_ref: 'Gabe.monkeys.num', new_value_ref: 'true' }, null);
    assert.deepEqual(res, [{
      operation: 'updatePlayer',
      roleName: 'Gabe',
      updates: { values: { monkeys: { num: { $set: true } } } }
    }]);
  });

  it('sets trip value to number', () => {
    const res = setValue({ content: { roles: [{ name: 'Gabe' }] } },
      { cabana: {} },
      { value_ref: 'cabana.monkeys', new_value_ref: 2 }, null);
    assert.deepEqual(res, [{
      operation: 'updateTrip',
      updates: { values: { cabana: { monkeys: { $set: 2 } } } }
    }]);
  });

  it('overwrites trip value to number', () => {
    const res = setValue({ content: { roles: [{ name: 'Gabe' }] } },
      { cabana: { monkeys: 6 } },
      { value_ref: 'cabana.monkeys', new_value_ref: 2 }, null);
    assert.deepEqual(res, [{
      operation: 'updateTrip',
      updates: { values: { cabana: { monkeys: { $set: 2 } } } }
    }]);
  });

  it('overwrites trip value to string', () => {
    const res = setValue({ content: { roles: [{ name: 'Gabe' }] } },
      { cabana: { monkeys: 6 } },
      { value_ref: 'cabana.monkeys', new_value_ref: '"hi"' }, null);
    assert.deepEqual(res, [{
      operation: 'updateTrip',
      updates: { values: { cabana: { monkeys: { $set: 'hi' } } } }
    }]);
  });

  it('overwrites trip value to boolean', () => {
    const res = setValue({ content: { roles: [{ name: 'Gabe' }] } },
      { cabana: { monkeys: 6 } },
      { value_ref: 'cabana.monkeys', new_value_ref: false }, null);
    assert.deepEqual(res, [{
      operation: 'updateTrip',
      updates: { values: { cabana: { monkeys: { $set: false } } } }
    }]);
  });

  it('sets trip value to value of other ref', () => {
    const res = setValue({ content: { roles: [{ name: 'Gabe' }] } },
      { cabana: { monkeys: 6, bananas: 10 } },
      { value_ref: 'cabana.monkeys', new_value_ref: 'cabana.bananas' },
      null);
    assert.deepEqual(res, [{
      operation: 'updateTrip',
      updates: { values: { cabana: { monkeys: { $set: 10 } } } }
    }]);
  });
});
