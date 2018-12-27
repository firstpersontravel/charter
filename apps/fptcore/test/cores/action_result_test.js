const assert = require('assert');

const ActionResultCore = require('../../src/cores/action_result');

describe('ActionResultCore', () => {
  describe('#tempUpdateContext', () => {
    describe('#updateTrip', () => {
      it('updates trip fields', () => {
        const old = {};
        const ops = [{
          operation: 'updateTripFields',
          fields: { newField: 123 }
        }];
        const res = ActionResultCore.tempUpdateContext(old, ops);
        assert.deepStrictEqual(res, { newField: 123 });
      });
    });

    describe('#updateTripValues', () => {
      it('updates trip values', () => {
        const old = {};
        const ops = [{
          operation: 'updateTripValues',
          values: { newField: 123 }
        }];
        const res = ActionResultCore.tempUpdateContext(old, ops);
        assert.deepStrictEqual(res, { newField: 123 });
      });
    });

    describe('#updateTripHistory', () => {
      it('updates trip history', () => {
        const old = {};
        const ops = [{
          operation: 'updateTripHistory',
          history: { newField: 123 }
        }];
        const res = ActionResultCore.tempUpdateContext(old, ops);
        assert.deepStrictEqual(res, { history: { newField: 123 } });
      });
    });

    describe('#updatePlayerFields', () => {
      it('updates player fields', () => {
        const old = { Phone: {} };
        const ops = [{
          operation: 'updatePlayerFields',
          roleName: 'Phone',
          fields: { otherField: '456' }
        }];
        const res = ActionResultCore.tempUpdateContext(old, ops);
        assert.deepStrictEqual(res, { Phone: { otherField: '456' } });
      });
    });
  });
});
