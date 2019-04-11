const assert = require('assert');
const moment = require('moment');
const sinon = require('sinon');

const TriggerActionCore = require('../../src/cores/trigger_action');

const sandbox = sinon.sandbox.create();

const now = moment.utc();

describe('TriggerActionCore', () => {
  afterEach(() => {
    sandbox.restore();
  });

  describe('#unpackedActionsForTrigger', () => {
    it('returns actions with added event and trigger info', () => {
      sandbox.stub(TriggerActionCore, 'packedActionsForTrigger').callsFake(() => {
        return [{ name: 'fake', param1: 1 }];
      });
      const trigger = { name: 'trigger' };
      const contextWithEvent = { event: { type: 'event' } };
      const actionContext = { evalContext: contextWithEvent, evaluateAt: now };

      const result = TriggerActionCore.unpackedActionsForTrigger(trigger,
        actionContext);

      assert.deepStrictEqual(result, [{
        name: 'fake',
        params: { param1: 1 },
        scheduleAt: now,
        triggerName: trigger.name,
        event: contextWithEvent.event
      }]);

      // Ensure TriggerActionCore.packedActionsForTrigger was called with the
      // event added to the context -- for when triggers have if statements
      // that depend on the contextual event.
      assert.deepStrictEqual(
        TriggerActionCore.packedActionsForTrigger.firstCall.args,
        [trigger, actionContext]);
    });
  });

  describe('#packedActionsForClause', () => {
    const actionContext = { evalContext: { valueA: true, valueB: false } };
    const simpleAction = { name: 'act', params: {} };
    const otherAction = { name: 'other', params: {} };
    const thirdAction = { name: 'third', params: {} };
    const fourthAction = { name: 'fourth', params: {} };

    it('handles simple list', () => {
      const clause = {actions: [simpleAction]};
      const res = TriggerActionCore.packedActionsForClause(clause, actionContext);
      assert.deepStrictEqual(res, [simpleAction]);
    });

    it('handles single passing if', () => {
      const clause = {
        if: { op: 'istrue', ref: 'valueA' },
        actions: [simpleAction]
      };
      const res = TriggerActionCore.packedActionsForClause(clause, actionContext);
      assert.deepStrictEqual(res, [simpleAction]);
    });

    it('handles single failing if', () => {
      const clause = {
        if: { op: 'not', item: { op: 'istrue', ref: 'valueA' } },
        actions: [simpleAction]
      };
      const res = TriggerActionCore.packedActionsForClause(clause, actionContext);
      assert.deepStrictEqual(res, []);
    });

    it('handles single failing if with else', () => {
      const clause = {
        if: { op: 'istrue', ref: 'valueB' },
        actions: [simpleAction],
        else: [otherAction]
      };
      const res = TriggerActionCore.packedActionsForClause(clause, actionContext);
      assert.deepStrictEqual(res, [otherAction]);
    });

    it('handles nested actions', () => {
      const clause = {
        if: { op: 'not', item: { op: 'istrue', ref: 'valueB' } },
        actions: [{
          if: {op: 'istrue', ref: 'valueB' },
          actions: [thirdAction],
          else: [otherAction]
        }]
      };
      const res = TriggerActionCore.packedActionsForClause(clause, actionContext);
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
      const res = TriggerActionCore.packedActionsForClause(clause, actionContext);
      assert.deepStrictEqual(res, [thirdAction]);
    });

    it('handles list of clauses', () => {
      const clause = {
        if: {op: 'istrue', ref: 'valueA' },
        actions: [
          simpleAction,
          {
            if: { op: 'istrue', ref: 'valueB' },
            actions: [otherAction]
          }, {
            if: { op: 'not', item: { op: 'istrue', ref: 'valueB' } },
            actions: [thirdAction]
          }
        ]
      };
      const res = TriggerActionCore.packedActionsForClause(clause, actionContext);
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
        TriggerActionCore.packedActionsForClause(
          clause, { evalContext: { a: true } }
        ), [simpleAction]);
      assert.deepStrictEqual(
        TriggerActionCore.packedActionsForClause(
          clause, { evalContext: { a: true, b: true } }
        ), [simpleAction]);
      assert.deepStrictEqual(
        TriggerActionCore.packedActionsForClause(
          clause, { evalContext: { b: true } }
        ), [otherAction]);
      assert.deepStrictEqual(
        TriggerActionCore.packedActionsForClause(
          clause, { evalContext: { b: true, c: true } }
        ), [otherAction]);
      assert.deepStrictEqual(
        TriggerActionCore.packedActionsForClause(
          clause, { evalContext: { c: true } }
        ), [thirdAction]);
      assert.deepStrictEqual(
        TriggerActionCore.packedActionsForClause(
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
      assert.deepStrictEqual(TriggerActionCore.packedActionsForClause(
        clause, actionContextAll), [cue1]);

      const actionContext12 = { evalContext: { val1: true, val2: true } };
      assert.deepStrictEqual(TriggerActionCore.packedActionsForClause(
        clause, actionContext12), [cue2]);

      const actionContext3 = { evalContext: { val3: true } };
      assert.deepStrictEqual(TriggerActionCore.packedActionsForClause(
        clause, actionContext3), []);
    });
  });

  describe('#unpackAction', () => {
    function assertOffset(actual, expected, offsetInSeconds) {
      assert.equal(
        actual.format(),
        expected.clone().add(offsetInSeconds, 'seconds').format());
    }

    const now = moment.utc('2017-02-01T20:57:22Z');

    const actionContext = {
      evalContext: {
        schedule: {
          time134p: '2017-03-23T20:34:00.000Z',
          time734a: '2017-03-25T10:34:00.000Z',
          future: '2017-10-25T10:34:00.000Z'
        }
      },
      evaluateAt: now
    };
    const time134p = moment.utc(actionContext.evalContext.schedule.time134p);

    it('unpacks an action object', () => {
      const packed = { name: 'x', param1: 'y', offset: '10m' };
      const res = TriggerActionCore.unpackAction(packed, actionContext);
      assert.deepStrictEqual(res, {
        name: 'x',
        params: { param1: 'y' },
        scheduleAt: now.clone().add(10, 'minutes')
      });
    });

    it('schedules for now when no modifier', () => {
      const packed = { name: 'x', param1: 'y' };
      const res = TriggerActionCore.unpackAction(packed, actionContext);
      assertOffset(res.scheduleAt, now, 0);
    });

    it('schedules with relative time modifier', () => {
      const packed = { name: 'x', param1: 'y', offset: '3m' };
      const res = TriggerActionCore.unpackAction(packed, actionContext);
      assertOffset(res.scheduleAt, now, 180);
    });

    it('schedules with absolute time modifier', () => {
      const packed = { name: 'x', param1: 'y', when: 'time134p' };
      const res = TriggerActionCore.unpackAction(packed, actionContext);
      assertOffset(res.scheduleAt, time134p, 0);
    });

    it('schedules with complex time modifier', () => {
      const packed = { name: 'x', when: 'time134p', offset: '10m' };
      const res = TriggerActionCore.unpackAction(packed, actionContext);
      assertOffset(res.scheduleAt, time134p, 600);
    });

    it('schedules with complex negative time modifier', () => {
      const packed = { name: 'x', when: 'time134p', offset: '-10s' };
      const res = TriggerActionCore.unpackAction(packed, actionContext);
      assertOffset(res.scheduleAt, time134p, -10);
    });
  });
});
