const assert = require('assert');
const sinon = require('sinon');

const ActionParamCore = require('../../src/cores/action_param');

const sandbox = sinon.sandbox.create();

describe('ActionParamCore', () => {

  afterEach(() => {
    sandbox.restore();
  });

  describe('#prepareParam', () => {
    describe('string', () => {
      it('strips double quotes', () => {
        const spec = { type: 'string' };
        const res = ActionParamCore.prepareParam(spec, '"hi"', null);
        assert.strictEqual(res, 'hi');
      });

      it('does not strip single quotes', () => {
        const spec = { type: 'string' };
        const res = ActionParamCore.prepareParam(spec, '\'hi\'', null);
        assert.strictEqual(res, '\'hi\'');
      });

      it('returns unquoted strings unchanged', () => {
        const spec = { type: 'string' };
        const res = ActionParamCore.prepareParam(spec, 'abc"', null);
        assert.strictEqual(res, 'abc"');
      });
    });

    describe('number', () => {
      it('converts numbers', () => {
        const spec = { type: 'number' };
        const res = ActionParamCore.prepareParam(spec, '2', null);
        assert.strictEqual(res, 2);
      });

      it('preserves numbers', () => {
        const spec = { type: 'number' };
        const res = ActionParamCore.prepareParam(spec, 2, null);
        assert.strictEqual(res, 2);
      });

      it('returns NaN for non-numbers', () => {
        const spec = { type: 'number' };
        const res = ActionParamCore.prepareParam(spec, 'abc', null);
        assert(isNaN(res));
      });
    });

    describe('other', () => {
      it('preserves other param types', () => {
        const spec = { type: 'other' };
        const res = ActionParamCore.prepareParam(spec, 'abc', null);
        assert.strictEqual(res, 'abc');
      });
    });
  });

  describe('#prepareParams', () => {
    it('calls prepareParam for each arg', () => {
      const stub = sandbox.stub(ActionParamCore, 'prepareParam');
      stub.onFirstCall().returns(3);
      stub.onSecondCall().returns(4);

      const actionContext = {};
      const spec = { key1: { spec1: true }, key2: { spec2: true } };
      const params = { key1: 1, key2: 2 };

      const res = ActionParamCore.prepareParams(spec, params, actionContext);

      // Right return value
      assert.deepStrictEqual(res, { key1: 3, key2: 4 });

      // Prepare param called
      sinon.assert.calledTwice(ActionParamCore.prepareParam);
      assert.deepStrictEqual(ActionParamCore.prepareParam.firstCall.args,
        [spec.key1, params.key1, actionContext]);
      assert.deepStrictEqual(ActionParamCore.prepareParam.secondCall.args,
        [spec.key2, params.key2, actionContext]);
    });
  });
});
