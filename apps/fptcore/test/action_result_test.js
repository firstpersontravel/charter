const assert = require('assert');

const ActionResultCore = require('../src/action_result');

describe('ActionResultCore', () => {

  describe('#tempUpdateContext', () => {

    it('updates playthrough values deeply', () => {
      const old = {};
      const ops = [{
        operation: 'updatePlaythrough',
        updates: { values: { a: { b: { c: { $set: 'def' } } } } }
      }];
      const res = ActionResultCore.tempUpdateContext(old, ops);
      assert.deepStrictEqual(res, { a: { b: { c: 'def' } } });
    });

    it('updates participant values deeply', () => {
      const old = { Phone: {} };
      const ops = [{
        operation: 'updateParticipant',
        roleName: 'Phone',
        updates: { values: { a: { b: { c: { $set: 'def' } } } } }
      }];
      const res = ActionResultCore.tempUpdateContext(old, ops);
      assert.deepStrictEqual(res, { Phone: { a: { b: { c: 'def' } } } });
    });

    it('updates page with special value', () => {
      const old = { Phone: { currentPageName: 'old' } };
      const ops = [{
        operation: 'updateParticipant',
        roleName: 'Phone',
        updates: { currentPageName: { $set: 'new' } }
      }];
      const res = ActionResultCore.tempUpdateContext(old, ops);
      assert.deepStrictEqual(res, { Phone: { currentPageName: 'new' } });
    });

  });

});
