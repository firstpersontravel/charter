const assert = require('assert');

const ActionResultCore = require('../src/action_result');

describe('ActionResultCore', () => {

  describe('#tempUpdateContext', () => {

    it('updates trip values deeply', () => {
      const old = {};
      const ops = [{
        operation: 'updateTrip',
        updates: { values: { a: { b: { c: { $set: 'def' } } } } }
      }];
      const res = ActionResultCore.tempUpdateContext(old, ops);
      assert.deepStrictEqual(res, { a: { b: { c: 'def' } } });
    });

    it('updates player values deeply', () => {
      const old = { Phone: {} };
      const ops = [{
        operation: 'updatePlayer',
        roleName: 'Phone',
        updates: { values: { a: { b: { c: { $set: 'def' } } } } }
      }];
      const res = ActionResultCore.tempUpdateContext(old, ops);
      assert.deepStrictEqual(res, { Phone: { a: { b: { c: 'def' } } } });
    });

    it('updates page with special value', () => {
      const old = { Phone: { currentPageName: 'old' } };
      const ops = [{
        operation: 'updatePlayer',
        roleName: 'Phone',
        updates: { currentPageName: { $set: 'new' } }
      }];
      const res = ActionResultCore.tempUpdateContext(old, ops);
      assert.deepStrictEqual(res, { Phone: { currentPageName: 'new' } });
    });

  });

});
