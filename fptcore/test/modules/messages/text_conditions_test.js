const assert = require('assert');

const textConditions = require('../../../src/modules/messages/text_conditions');

describe('#text_contains', () => {
  function assertIfEq(ctx, stmt, val) {
    assert.strictEqual(textConditions.text_contains.eval(
      stmt, { evalContext: ctx }), val);
  }

  it('finds text in middle', () => {
    const stmt = { op: 'text_contains', part: 'gabe' };
    const context = { event: { message: { content: 'hi there gabe!' } } };
    assertIfEq(context, stmt, true);
  });

  it('is case insensitive', () => {
    const stmt = { op: 'text_contains', part: 'gabe' };
    const context = { event: { message: { content: 'hi there GABE!' } } };
    assertIfEq(context, stmt, true);
  });
});

describe('#text_is_affirmative', () => {
  function assertIfEq(ctx, stmt, val) {
    assert.strictEqual(textConditions.text_is_affirmative.eval(stmt,
      { evalContext: ctx }), val);
  }

  it('finds yes', () => {
    const stmt = { op: 'text_contains', part: 'gabe' };
    const context = { event: { message: { content: 'yes' } } };
    assertIfEq(context, stmt, true);
  });

  it('finds no', () => {
    const stmt = { op: 'text_contains', part: 'gabe' };
    const context = { event: { message: { content: 'NO' } } };
    assertIfEq(context, stmt, false);
  });
});
