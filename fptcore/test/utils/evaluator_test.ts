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
        testEvaluator.if({ evalContext: {} }, { op: 'greaterthan' });
      });
    });

    it('returns true if null', () => {
      assertIfEq({ evalContext: {} }, null, true);
    });

    it.skip('calls if statements in registry', () => {
      
    });
  });
});
