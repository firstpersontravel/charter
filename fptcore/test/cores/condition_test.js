const assert = require('assert');
const sinon = require('sinon');

const ConditionCore = require('../../src/cores/condition');

const sandbox = sinon.sandbox.create();

describe('ConditionCore', () => {

  afterEach(() => {
    sandbox.restore();
  });

  describe('#if', () => {
    function assertIfEq(ctx, stmt, val) {
      assert.strictEqual(ConditionCore.if(ctx, stmt), val);
    }

    it('throw error if invalid if command', () => {
      assert.throws(() => {
        ConditionCore.if({}, { op: 'greaterthan' });
      });
    });

    it('returns true if null', () => {
      assertIfEq({}, null, true);
    });

    describe('#istrue', () => {
      it('evaluates', () => {
        const stmt = { op: 'istrue', ref: 'v' };
        assertIfEq({ v: true }, stmt, true);
        assertIfEq({ v: 1 }, stmt, true);
        assertIfEq({ v: '1' }, stmt, true);
        assertIfEq({ v: 'true' }, stmt, true);
        assertIfEq({ v: false }, stmt, false);
        assertIfEq({ v: 0 }, stmt, false);
        assertIfEq({ v: null }, stmt, false);
        assertIfEq({}, stmt, false);
      });

      it('evaluates nested objects', () => {
        assertIfEq({ a: { b: '2' } }, {op: 'istrue', ref: 'a.b'}, true);
        assertIfEq({ a: { b: '2' } }, {op: 'istrue', ref: 'a.c'}, false);
      });
    });

    describe('#equals', () => {
      it('evaluates with constants', () => {
        assertIfEq({}, {op: 'equals', ref1: '"2"', ref2: '"2"'}, true);
        assertIfEq({}, {op: 'equals', ref1: '1', ref2: '1'}, true);
        assertIfEq({}, {op: 'equals', ref1: 'true', ref2: 'true'}, true);
        assertIfEq({}, {op: 'equals', ref1: '"2"', ref2: '"1"'}, false);
        assertIfEq({}, {op: 'equals', ref1: '1', ref2: '0'}, false);
        assertIfEq({}, {op: 'equals', ref1: '5', ref2: 'true'}, false);
      });

      it('evaluates with constant and var', () => {
        assertIfEq({ v: '2' }, {op: 'equals', ref1: 'v', ref2: '"2"'}, true);
        assertIfEq({ v: 1 }, {op: 'equals', ref1: 'v', ref2: '1'}, true);
        assertIfEq({ v: true }, {op: 'equals', ref1: 'v', ref2: 'true'}, true);
        assertIfEq({ v: null }, {op: 'equals', ref1: 'v', ref2: 'null'}, true);
        assertIfEq({ v: '2' }, {op: 'equals', ref1: 'v', ref2: '"1"'}, false);
        assertIfEq({ v: 1 }, {op: 'equals', ref1: 'v', ref2: '"1"'}, false);
        assertIfEq({ v: 1 }, {op: 'equals', ref1: 'v', ref2: '0'}, false);
        assertIfEq({ v: false }, {op: 'equals', ref1: 'v', ref2: 'true'},
          false);
        assertIfEq({ v: false }, {op: 'equals', ref1: 'v', ref2: 'null'},
          false);
        assertIfEq({ v: 'true' }, {op: 'equals', ref1: 'v', ref2: 'true'},
          false);
      });

      it('evaluates with var and var', () => {
        const stmt = { op: 'equals', ref1: 'a', ref2: 'b' };
        assertIfEq({ a: true, b: true }, stmt, true);
        assertIfEq({ a: false, b: false }, stmt, true);
        assertIfEq({ a: 1, b: 1 }, stmt, true);
        assertIfEq({ a: '1', b: '1' }, stmt, true);
        assertIfEq({ a: 2, b: 1 }, stmt, false);
        assertIfEq({ a: '1', b: 1 }, stmt, false);
        assertIfEq({ a: '1', b: '2' }, stmt, false);
      });

      it('evaluates nested objects', () => {
        assertIfEq({ a: { b: '2' } }, {op: 'equals', ref1: 'a.b', ref2: '"2"'},
          true);
        assertIfEq({ a: { b: '2' } }, {op: 'equals', ref1: '"2"', ref2: 'a.b'},
          true);
      });
    });

    describe('#contains', () => {
      it('evaluates', () => {
        assertIfEq({ a: 'A sIMPle THING', b: 'simple' },
          { op: 'contains', string_ref: 'a', part_ref: 'b'}, true);
        assertIfEq({ a: 'a simple man', b: 'simple' },
          { op: 'contains', string_ref: 'a', part_ref: 'b'}, true);
        assertIfEq({ a: 'a simple man', b: 'car' },
          { op: 'contains', string_ref: 'a', part_ref: 'b'}, false);
        assertIfEq({ b: 'house' },
          { op: 'contains', string_ref: '"my house"', part_ref: 'b'}, true);
        assertIfEq({ a: 'a simple man'},
          { op: 'contains', string_ref: 'a', part_ref: '"car"'}, false);
      });
    });

    describe('#text_contains', () => {
      it.skip('evaluates', () => {});
    });

    describe('#text_is_affirmative', () => {
      it.skip('evaluates', () => {});
    });

    describe('#matches', () => {
      it('evaluates', () => {
        assertIfEq({ a: '9144844223', },
          {op: 'matches', string_ref: 'a', regex_ref: '"^\\d{10}$"'}, true);
        assertIfEq({ a: '91448442233', },
          {op: 'matches', string_ref: 'a', regex_ref: '"^\\d{10}$"'}, false);
        assertIfEq({ a: '914484422', },
          {op: 'matches', string_ref: 'a', regex_ref: '"^\\d{10}$"'}, false);
        assertIfEq({ a: 'abcd', },
          {op: 'matches', string_ref: 'a', regex_ref: '"^[a-d]+$"'}, true);
        assertIfEq({ a: 'abcde', },
          {op: 'matches', string_ref: 'a', regex_ref: '"^[a-d]+$"'}, false);
      });
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
                { op: 'contains', string_ref: 'c', part_ref: 'd'},
                { op: 'istrue', ref: 'e' }
              ]
            }
          ]
        };
        assertIfEq({ a: false, b: true }, op, true);
        assertIfEq({ a: false, b: false, c: '123', d: '2' }, op, true);
        assertIfEq({ a: false, b: false, c: '123', d: '4' }, op, false);
        assertIfEq({ a: false, b: false, c: '123', d: '4', e: 1 }, op, true);
      });
    });

    describe('#and', () => {
      it('evaluates', () => {
        const op = {
          op: 'and',
          items: [
            { op: 'istrue', ref: 'a'},
            { op: 'equals', ref1: 'b', ref2: 'c'}
          ]
        };
        assertIfEq({ a: true, b: 2, c: 2 }, op, true);
        assertIfEq({ a: true, b: 1, c: 2 }, op, false);
        assertIfEq({ a: false, b: 2, c: 2 }, op, false);
        assertIfEq({ a: false, b: 1, c: 2 }, op, false);
      });

      it('evaluates nested', () => {
        const op = {
          op: 'and',
          items: [
            { op: 'istrue', ref: 'a'},
            { op: 'equals', ref1: 'b', ref2: 'c'},
            {
              op: 'and',
              items: [{ op: 'istrue', ref: 'd' }]
            }
          ]
        };
        assertIfEq({ a: true, b: 2, c: 2, d: true }, op, true);
        assertIfEq({ a: true, b: 2, c: 2, d: false }, op, false);
      });

      it('evaluates real world example', () => {
        const stmt = {
          op: 'and',
          items: [{
            op: 'istrue',
            ref: 'sent_offer'
          }, {
            op: 'or',
            items: [{
              op: 'contains',
              string_ref: 'event.msg.content',
              part_ref: '"y"'
            }, {
              op: 'contains',
              string_ref: 'event.msg.content',
              part_ref: '"ok"'
            }, {
              op: 'contains',
              string_ref: 'event.msg.content',
              part_ref: '"sure"'
            }]
          }]
        };

        const ctx1 = { sent_offer: true, event: { msg: { content: 'yes' } } };
        assert.strictEqual(ConditionCore.if(ctx1, stmt), true);

        const ctx2 = { sent_offer: false, event: { msg: { content: 'yes' } } };
        assert.strictEqual(ConditionCore.if(ctx2, stmt), false);

        const ctx3 = {
          sent_offer: true, event: { msg: { content: ' Sure THing' } }
        };
        assert.strictEqual(ConditionCore.if(ctx3, stmt), true);

        const ctx4 = { sent_offer: true, event: { msg: { content: 'nope' } } };
        assert.strictEqual(ConditionCore.if(ctx4, stmt), false);
      });
    });

    describe('#not', () => {
      it('evaluates not istrue', () => {
        const stmt = {
          op: 'not',
          item: { op: 'istrue', ref: 'v' }
        };
        assertIfEq({ v: true }, stmt, false);
        assertIfEq({ v: 1 }, stmt, false);
        assertIfEq({ v: '1' }, stmt, false);
        assertIfEq({ v: 'true' }, stmt, false);
        assertIfEq({ v: false }, stmt, true);
        assertIfEq({ v: 0 }, stmt, true);
        assertIfEq({ v: null }, stmt, true);
        assertIfEq({}, stmt, true);

        // nested examples
        assertIfEq(
          { a: { b: '2' } },
          { op: 'not', item: { op: 'istrue', ref: 'a.b' } },
          false);
        assertIfEq(
          { a: { b: '2' } },
          { op: 'not', item: { op: 'istrue', ref: 'a.c' } },
          true);
      });
    });
  });
});
