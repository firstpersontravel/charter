const assert = require('assert');
const sinon = require('sinon');

const TriggerCore = require('../../src/cores/trigger');

var sandbox = sinon.sandbox.create();

describe('TriggerCore', () => {

  afterEach(() => {
    sandbox.restore();
  });

  describe('#actionPhrasesForClause', () => {
    const actionContext = { evalContext: { valueA: true, valueB: false } };

    it('handles single item', () => {
      const clause = {actions: 'action'};
      const res = TriggerCore.actionPhrasesForClause(clause, actionContext);
      assert.deepEqual(res, ['action']);
    });

    it('handles simple list', () => {
      const clause = {actions: ['action']};
      const res = TriggerCore.actionPhrasesForClause(clause, actionContext);
      assert.deepEqual(res, ['action']);
    });

    it('handles single passing if', () => {
      const clause = {if: 'valueA', actions: ['action']};
      const res = TriggerCore.actionPhrasesForClause(clause, actionContext);
      assert.deepEqual(res, ['action']);
    });

    it('handles single failing if', () => {
      const clause = {if: 'not valueA', actions: ['action']};
      const res = TriggerCore.actionPhrasesForClause(clause, actionContext);
      assert.deepEqual(res, []);
    });

    it('handles single failing if with else', () => {
      const clause = {if: 'valueB', actions: ['action'], else: ['other']};
      const res = TriggerCore.actionPhrasesForClause(clause, actionContext);
      assert.deepEqual(res, ['other']);
    });

    it('handles nested actions', () => {
      const clause = {
        if: 'not valueB',
        actions: {
          if: 'valueB',
          actions: ['final'],
          else: ['other']
        }
      };
      const res = TriggerCore.actionPhrasesForClause(clause, actionContext);
      assert.deepEqual(res, ['other']);
    });

    it('handles nested else', () => {
      const clause = {
        if: 'valueB',
        actions: ['action'],
        else: {
          if: 'valueA',
          actions: 'final',
          else: ['other']
        }
      };
      const res = TriggerCore.actionPhrasesForClause(clause, actionContext);
      assert.deepEqual(res, ['final']);
    });

    it('handles list of clauses', () => {
      const clause = {
        if: 'valueA',
        actions: [
          'action',
          { if: 'valueB', actions: 'action2' },
          { if: 'not valueB', actions: ['action3'] }
        ]
      };
      const res = TriggerCore.actionPhrasesForClause(clause, actionContext);
      assert.deepEqual(res, ['action', 'action3']);
    });

    it('handles else ifs', () => {
      const clause = {
        if: 'a',
        actions: ['action1'],
        elseifs: [{
          if: 'b',
          actions: ['action2']
        }, {
          if: 'c',
          actions: ['action3']
        }],
        else: ['other']
      };
      assert.deepEqual(
        TriggerCore.actionPhrasesForClause(
          clause, { evalContext: { a: true } }
        ), ['action1']);
      assert.deepEqual(
        TriggerCore.actionPhrasesForClause(
          clause, { evalContext: { a: true, b: true } }
        ), ['action1']);
      assert.deepEqual(
        TriggerCore.actionPhrasesForClause(
          clause, { evalContext: { b: true } }
        ), ['action2']);
      assert.deepEqual(
        TriggerCore.actionPhrasesForClause(
          clause, { evalContext: { b: true, c: true } }
        ), ['action2']);
      assert.deepEqual(
        TriggerCore.actionPhrasesForClause(
          clause, { evalContext: { c: true } }
        ), ['action3']);
      assert.deepEqual(
        TriggerCore.actionPhrasesForClause(
          clause, { evalContext: {} }
        ), ['other']);
    });

    it('handles complex nested if', () => {
      const clause = {
        if: 'val1 and val2',
        actions: {
          if: 'val3',
          actions: ['cue ALLTRUE'],
          else: ['cue 12NOT3']
        }
      };
      const actionContextAll = {
        evalContext: { val1: true, val2: true, val3: true }
      };
      assert.deepEqual(TriggerCore.actionPhrasesForClause(
        clause, actionContextAll), ['cue ALLTRUE']);

      const actionContext12 = { evalContext: { val1: true, val2: true } };
      assert.deepEqual(TriggerCore.actionPhrasesForClause(
        clause, actionContext12), ['cue 12NOT3']);

      const actionContext3 = { evalContext: { val3: true } };
      assert.deepEqual(TriggerCore.actionPhrasesForClause(
        clause, actionContext3), []);
    });
  });
});
