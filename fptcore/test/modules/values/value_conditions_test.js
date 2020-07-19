const assert = require('assert');

const valueConditions = require('../../../src/modules/values/value_conditions');

describe('#value_is_true', () => {
  function assertIfEq(ctx, stmt, val) {
    assert.strictEqual(
      valueConditions.value_is_true.eval(stmt, { evalContext: ctx }), val);
  }

  it('evaluates', () => {
    const stmt = { op: 'value_is_true', ref: 'v' };
    assertIfEq({ v: true }, stmt, true);
    assertIfEq({ v: 1 }, stmt, true);
    assertIfEq({ v: '1' }, stmt, true);
    assertIfEq({ v: 'true' }, stmt, true);
    assertIfEq({ v: false }, stmt, false);
    assertIfEq({ v: 0 }, stmt, false);
    assertIfEq({ v: null }, stmt, false);
    assertIfEq({}, stmt, false);
  });

  it('evaluates nested objects', () => {
    assertIfEq({ a: { b: '2' } }, {op: 'value_is_true', ref: 'a.b'}, true);
    assertIfEq({ a: { b: '2' } }, {op: 'value_is_true', ref: 'a.c'}, false);
  });
});

describe('#value_equals', () => {
  function assertIfEq(ctx, stmt, val) {
    assert.strictEqual(
      valueConditions.value_equals.eval(stmt, { evalContext: ctx }), val);
  }

  it('evaluates with constants', () => {
    assertIfEq({}, {op: 'value_equals', ref1: '"2"', ref2: '"2"'}, true);
    assertIfEq({}, {op: 'value_equals', ref1: '1', ref2: '1'}, true);
    assertIfEq({}, {op: 'value_equals', ref1: 'true', ref2: 'true'}, true);
    assertIfEq({}, {op: 'value_equals', ref1: '"2"', ref2: '"1"'}, false);
    assertIfEq({}, {op: 'value_equals', ref1: '1', ref2: '0'}, false);
    assertIfEq({}, {op: 'value_equals', ref1: '5', ref2: 'true'}, false);
  });

  it('evaluates with constant and var', () => {
    assertIfEq({ v: '2' }, {op: 'value_equals', ref1: 'v', ref2: '"2"'}, true);
    assertIfEq({ v: 1 }, {op: 'value_equals', ref1: 'v', ref2: '1'}, true);
    assertIfEq({ v: true }, {op: 'value_equals', ref1: 'v', ref2: 'true'}, true);
    assertIfEq({ v: null }, {op: 'value_equals', ref1: 'v', ref2: 'null'}, true);
    assertIfEq({ v: 1 }, {op: 'value_equals', ref1: 'v', ref2: '"1"'}, true);
    assertIfEq({ v: false }, {op: 'value_equals', ref1: 'v', ref2: 'null'}, true);
    assertIfEq({ v: 'true' }, {op: 'value_equals', ref1: 'v', ref2: 'true'}, true);
    assertIfEq({ v: 1 }, {op: 'value_equals', ref1: 'v', ref2: '0'}, false);
    assertIfEq({ v: '2' }, {op: 'value_equals', ref1: 'v', ref2: '"1"'}, false);
    assertIfEq({ v: false }, {op: 'value_equals', ref1: 'v', ref2: 'true'}, false);
  });

  it('evaluates with var and var', () => {
    const stmt = { op: 'value_equals', ref1: 'a', ref2: 'b' };
    assertIfEq({ a: true, b: true }, stmt, true);
    assertIfEq({ a: false, b: false }, stmt, true);
    assertIfEq({ a: 1, b: 1 }, stmt, true);
    assertIfEq({ a: '1', b: '1' }, stmt, true);
    assertIfEq({ a: '1', b: 1 }, stmt, true);
    assertIfEq({ a: 2, b: 1 }, stmt, false);
    assertIfEq({ a: '1', b: '2' }, stmt, false);
  });

  it('evaluates nested objects', () => {
    assertIfEq({ a: { b: '2' } }, {op: 'value_equals', ref1: 'a.b', ref2: '"2"'},
      true);
    assertIfEq({ a: { b: '2' } }, {op: 'value_equals', ref1: '"2"', ref2: 'a.b'},
      true);
  });
});

describe('#value_contains', () => {
  function assertIfEq(ctx, stmt, val) {
    assert.strictEqual(
      valueConditions.value_contains.eval(stmt, { evalContext: ctx }), val);
  }

  it('evaluates', () => {
    assertIfEq({ a: 'A sIMPle THING', b: 'simple' },
      { op: 'value_contains', string_ref: 'a', part_ref: 'b'}, true);
    assertIfEq({ a: 'a simple man', b: 'simple' },
      { op: 'value_contains', string_ref: 'a', part_ref: 'b'}, true);
    assertIfEq({ a: 'a simple man', b: 'car' },
      { op: 'value_contains', string_ref: 'a', part_ref: 'b'}, false);
    assertIfEq({ b: 'house' },
      { op: 'value_contains', string_ref: '"my house"', part_ref: 'b'}, true);
    assertIfEq({ a: 'a simple man'},
      { op: 'value_contains', string_ref: 'a', part_ref: '"car"'}, false);
  });
});
