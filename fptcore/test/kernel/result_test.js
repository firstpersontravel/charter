const assert = require('assert');

const KernelResult = require('../../src/kernel/result');

describe('KernelResult', () => {

  describe('#resultForOps', () => {
    it.skip('creates result', () => {

    });
    it.skip('creates result with wait', () => {

    });
  });

  describe('#concatResult', () => {
    it.skip('concatenates results', () => {

    });
  });

  describe('#tempUpdateContext', () => {
    describe('#updateTrip', () => {
      it('updates trip fields', () => {
        const actionContext = { evalContext: {}};
        const ops = [{
          operation: 'updateTripFields',
          fields: { newField: 123 }
        }];
        
        const res = KernelResult.tempUpdateContext(ops, actionContext);

        assert.deepStrictEqual(res.evalContext, { newField: 123 });
      });
    });

    describe('#updateTripValues', () => {
      it('updates trip values', () => {
        const actionContext = { evalContext: {}};
        const ops = [{
          operation: 'updateTripValues',
          values: { newField: 123 }
        }];
        
        const res = KernelResult.tempUpdateContext(ops, actionContext);

        assert.deepStrictEqual(res.evalContext, { newField: 123 });
      });
    });

    describe('#updateTripHistory', () => {
      it('updates trip history', () => {
        const actionContext = { evalContext: {}};
        const ops = [{
          operation: 'updateTripHistory',
          history: { newField: 123 }
        }];
        
        const res = KernelResult.tempUpdateContext(ops, actionContext);

        assert.deepStrictEqual(res.evalContext, { history: { newField: 123 } });
      });
    });

    describe('#updatePlayerFields', () => {
      it('updates player fields', () => {
        const actionContext = { evalContext: { Phone: {} } };
        const ops = [{
          operation: 'updatePlayerFields',
          roleName: 'Phone',
          fields: { otherField: '456' }
        }];
        
        const res = KernelResult.tempUpdateContext(ops, actionContext);

        assert.deepStrictEqual(res.evalContext,
          { Phone: { otherField: '456' } });
      });
    });
  });
});
