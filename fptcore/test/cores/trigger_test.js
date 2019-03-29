const assert = require('assert');
const sinon = require('sinon');

const TriggerCore = require('../../src/cores/trigger');

var sandbox = sinon.sandbox.create();

describe('TriggerCore', () => {
  afterEach(() => {
    sandbox.restore();
  });

  describe('#packedActionsForClause', () => {
    const actionContext = { evalContext: { valueA: true, valueB: false } };
    const simpleAction = { name: 'act', params: {} };
    const otherAction = { name: 'other', params: {} };
    const thirdAction = { name: 'third', params: {} };
    const fourthAction = { name: 'fourth', params: {} };

    it('handles simple list', () => {
      const clause = {actions: [simpleAction]};
      const res = TriggerCore.packedActionsForClause(clause, actionContext);
      assert.deepStrictEqual(res, [simpleAction]);
    });

    it('handles single passing if', () => {
      const clause = {
        if: { op: 'istrue', ref: 'valueA' },
        actions: [simpleAction]
      };
      const res = TriggerCore.packedActionsForClause(clause, actionContext);
      assert.deepStrictEqual(res, [simpleAction]);
    });

    it('handles single failing if', () => {
      const clause = {
        if: {op: 'istrue', neg: true, ref: 'valueA' },
        actions: [simpleAction]
      };
      const res = TriggerCore.packedActionsForClause(clause, actionContext);
      assert.deepStrictEqual(res, []);
    });

    it('handles single failing if with else', () => {
      const clause = {
        if: { op: 'istrue', ref: 'valueB' },
        actions: [simpleAction],
        else: [otherAction]
      };
      const res = TriggerCore.packedActionsForClause(clause, actionContext);
      assert.deepStrictEqual(res, [otherAction]);
    });

    it('handles nested actions', () => {
      const clause = {
        if: {op: 'istrue', neg: true, ref: 'valueB' },
        actions: [{
          if: {op: 'istrue', ref: 'valueB' },
          actions: [thirdAction],
          else: [otherAction]
        }]
      };
      const res = TriggerCore.packedActionsForClause(clause, actionContext);
      assert.deepStrictEqual(res, [otherAction]);
    });

    it('handles nested else', () => {
      const clause = {
        if: {op: 'istrue', ref: 'valueB' },
        actions: ['action'],
        else: [{
          if: {op: 'istrue', ref: 'valueA' },
          actions: [thirdAction],
          else: [otherAction]
        }]
      };
      const res = TriggerCore.packedActionsForClause(clause, actionContext);
      assert.deepStrictEqual(res, [thirdAction]);
    });

    it('handles list of clauses', () => {
      const clause = {
        if: {op: 'istrue', ref: 'valueA' },
        actions: [
          simpleAction,
          {
            if: {op: 'istrue', ref: 'valueB' },
            actions: [otherAction]
          }, {
            if: {op: 'istrue', neg: true, ref: 'valueB' },
            actions: [thirdAction]
          }
        ]
      };
      const res = TriggerCore.packedActionsForClause(clause, actionContext);
      assert.deepStrictEqual(res, [simpleAction, thirdAction]);
    });

    it('handles else ifs', () => {
      const clause = {
        if: {op: 'istrue', ref: 'a' },
        actions: [simpleAction],
        elseifs: [{
          if: {op: 'istrue', ref: 'b' },
          actions: [otherAction]
        }, {
          if: {op: 'istrue', ref: 'c' },
          actions: [thirdAction]
        }],
        else: [fourthAction]
      };
      assert.deepStrictEqual(
        TriggerCore.packedActionsForClause(
          clause, { evalContext: { a: true } }
        ), [simpleAction]);
      assert.deepStrictEqual(
        TriggerCore.packedActionsForClause(
          clause, { evalContext: { a: true, b: true } }
        ), [simpleAction]);
      assert.deepStrictEqual(
        TriggerCore.packedActionsForClause(
          clause, { evalContext: { b: true } }
        ), [otherAction]);
      assert.deepStrictEqual(
        TriggerCore.packedActionsForClause(
          clause, { evalContext: { b: true, c: true } }
        ), [otherAction]);
      assert.deepStrictEqual(
        TriggerCore.packedActionsForClause(
          clause, { evalContext: { c: true } }
        ), [thirdAction]);
      assert.deepStrictEqual(
        TriggerCore.packedActionsForClause(
          clause, { evalContext: {} }
        ), [fourthAction]);
    });

    it('handles complex nested if', () => {
      const cue1 = { name: 'cue', params: { cue_name: 'ALLTRUE' } };
      const cue2 = { name: 'cue', params: { cue_name: 'NOT' } };
      const clause = {
        if: {
          op: 'and',
          items: [
            { op: 'istrue', ref: 'val1' },
            { op: 'istrue', ref: 'val2' }
          ]
        },
        actions: [{
          if: { op: 'istrue', ref: 'val3' },
          actions: [cue1],
          else: [cue2]
        }]
      };
      const actionContextAll = {
        evalContext: { val1: true, val2: true, val3: true }
      };
      assert.deepStrictEqual(TriggerCore.packedActionsForClause(
        clause, actionContextAll), [cue1]);

      const actionContext12 = { evalContext: { val1: true, val2: true } };
      assert.deepStrictEqual(TriggerCore.packedActionsForClause(
        clause, actionContext12), [cue2]);

      const actionContext3 = { evalContext: { val3: true } };
      assert.deepStrictEqual(TriggerCore.packedActionsForClause(
        clause, actionContext3), []);
    });
  });
});
