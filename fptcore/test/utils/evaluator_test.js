const assert = require('assert');
const sinon = require('sinon');

const Evaluator = require('../../src/utils/evaluator');

const sandbox = sinon.sandbox.create();

const testEvaluator = new Evaluator({
  conditions: {
    istrue: {
      eval: (params, evalContext) => !!evalContext[params.ref]
    }
  }
});

function assertIfEq(ctx, stmt, val) {
  assert.strictEqual(testEvaluator.if(ctx, stmt), val);
}

describe('Evaluator', () => {
  afterEach(() => {
    sandbox.restore();
  });

  describe('#if', () => {
    it('throw error if invalid if command', () => {
      assert.throws(() => {
        testEvaluator.if({}, { op: 'greaterthan' });
      });
    });

    it('returns true if null', () => {
      assertIfEq({}, null, true);
    });

    describe('#or', () => {
      it('evaluates', () => {
        const op = {
          op: 'or',
          items: [{ op: 'istrue', ref: 'a'}, { op: 'istrue', ref: 'b'}]
        };
        assertIfEq({ a: true, b: false }, op, true);
        assertIfEq({ a: false, b: true }, op, true);
        assertIfEq({ a: false, b: false }, op, false);
      });

      it('evaluates nested', () => {
        const op = {
          op: 'or',
          items: [
            { op: 'istrue', ref: 'a'},
            { op: 'istrue', ref: 'b'},
            {
              op: 'or',
              items: [
                { op: 'istrue', ref: 'c' },
                { op: 'istrue', ref: 'd' }
              ]
            }
          ]
        };
        assertIfEq({ a: false, b: true }, op, true);
        assertIfEq({ a: false, b: false, c: true }, op, true);
        assertIfEq({ a: false, b: false, c: false }, op, false);
        assertIfEq({ a: false, b: false, c: false, d: true }, op, true);
      });
    });

    describe('#and', () => {
      it('evaluates', () => {
        const op = {
          op: 'and',
          items: [
            { op: 'istrue', ref: 'a'},
            { op: 'istrue', ref: 'b'}
          ]
        };
        assertIfEq({ a: true, b: true }, op, true);
        assertIfEq({ a: true, b: false }, op, false);
        assertIfEq({ a: false, b: true }, op, false);
        assertIfEq({ a: false, b: false }, op, false);
      });

      it('evaluates nested', () => {
        const op = {
          op: 'and',
          items: [
            { op: 'istrue', ref: 'a'},
            { op: 'istrue', ref: 'b' },
            { op: 'and', items: [{ op: 'istrue', ref: 'c' }] }
          ]
        };
        assertIfEq({ a: true, b: true, c: true }, op, true);
        assertIfEq({ a: true, b: true, c: false }, op, false);
      });
    });

    describe('#not', () => {
      it('evaluates not', () => {
        const stmt = { op: 'not', item: { op: 'istrue', ref: 'v' } };
        assertIfEq({ v: true }, stmt, false);
        assertIfEq({ v: 1 }, stmt, false);
        assertIfEq({ v: '1' }, stmt, false);
        assertIfEq({ v: 'true' }, stmt, false);
        assertIfEq({ v: false }, stmt, true);
        assertIfEq({ v: 0 }, stmt, true);
        assertIfEq({ v: null }, stmt, true);
        assertIfEq({}, stmt, true);
      });

      it('evaluates nested', () => {
        assertIfEq(
          { a: true },
          { op: 'not', item: { op: 'istrue', ref: 'a' } },
          false);
        assertIfEq(
          { a: false },
          { op: 'not', item: { op: 'istrue', ref: 'a' } },
          true);
      });
    });
  });
});
