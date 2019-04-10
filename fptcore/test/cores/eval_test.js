const assert = require('assert');
const sinon = require('sinon');

const EvalCore = require('../../src/cores/eval');

const sandbox = sinon.sandbox.create();

describe('EvalCore', () => {

  afterEach(() => {
    sandbox.restore();
  });

  describe('#if', () => {
    function assertIfEq(ctx, stmt, val) {
      assert.strictEqual(EvalCore.if(ctx, stmt), val);
    }

    it('throw error if invalid if command', () => {
      assert.throws(() => {
        EvalCore.if({}, { op: 'greaterthan' });
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

    describe('#message_contains', () => {
      it.skip('evaluates', () => {});
    });

    describe('#message_is_affirmative', () => {
      
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
        assert.strictEqual(EvalCore.if(ctx1, stmt), true);

        const ctx2 = { sent_offer: false, event: { msg: { content: 'yes' } } };
        assert.strictEqual(EvalCore.if(ctx2, stmt), false);

        const ctx3 = {
          sent_offer: true, event: { msg: { content: ' Sure THing' } }
        };
        assert.strictEqual(EvalCore.if(ctx3, stmt), true);

        const ctx4 = { sent_offer: true, event: { msg: { content: 'nope' } } };
        assert.strictEqual(EvalCore.if(ctx4, stmt), false);
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

  describe('#lookupRef', () => {
    it('handles true constants', () => {
      assert.strictEqual(EvalCore.lookupRef({}, true), true);
      assert.strictEqual(EvalCore.lookupRef({}, false), false);
      assert.strictEqual(EvalCore.lookupRef({}, null), null);
    });

    it('handles string constants', () => {
      assert.strictEqual(EvalCore.lookupRef({}, 'true'), true);
      assert.strictEqual(EvalCore.lookupRef({}, 'false'), false);
      assert.strictEqual(EvalCore.lookupRef({}, 'null'), null);
    });

    it('handles true numbers', () => {
      assert.strictEqual(EvalCore.lookupRef({}, 1), 1);
      assert.strictEqual(EvalCore.lookupRef({}, -10), -10);
      assert.strictEqual(EvalCore.lookupRef({}, 1.5), 1.5);
    });

    it('handles string numbers', () => {
      assert.strictEqual(EvalCore.lookupRef({}, '1'), 1);
      assert.strictEqual(EvalCore.lookupRef({}, '-10'), -10);
      assert.strictEqual(EvalCore.lookupRef({}, '1.5'), 1.5);
    });

    it('returns null for non-string non-constants', () => {
      assert.strictEqual(EvalCore.lookupRef({}, { object: 1 }), null);
      assert.strictEqual(EvalCore.lookupRef({}, [1]), null);
    });

    it('handles strings', () => {
      assert.strictEqual(EvalCore.lookupRef({}, '"string"'), 'string');
      assert.strictEqual(EvalCore.lookupRef({}, '\'string\''), 'string');
      assert.strictEqual(EvalCore.lookupRef({}, '\'s_0_f934tg-@$#T$*R\''),
        's_0_f934tg-@$#T$*R');
    });

    it('handles refs', () => {
      assert.strictEqual(EvalCore.lookupRef({ a: 'test' }, 'a'), 'test');
      assert.strictEqual(EvalCore.lookupRef({ a: true }, 'a'), true);
      assert.strictEqual(EvalCore.lookupRef({ a: null }, 'a'), null);
      assert.strictEqual(EvalCore.lookupRef({ a: true }, 'c'), null);
      assert.strictEqual(EvalCore.lookupRef({ a: { b: 'test.test' } }, 'a.b'),
        'test.test');
      assert.strictEqual(EvalCore.lookupRef({ a: { b: 'test.test' } }, 'a.c'),
        null);
    });
  });

  describe('#templateText', () => {
    it('templates constants', () => {
      assert.equal(EvalCore.templateText({}, null), '');
      assert.equal(EvalCore.templateText({}, undefined), '');
      assert.equal(EvalCore.templateText({}, false), 'No');
      assert.equal(EvalCore.templateText({}, true), 'Yes');
    });

    it('templates numbers', () => {
      assert.equal(EvalCore.templateText({}, 2), '2');
      assert.equal(EvalCore.templateText({}, 2.1), '2.1');
    });

    it('templates timestamps', () => {
      assert.equal(EvalCore.templateText({}, '2017-02-16T21:44:02Z',
        'US/Pacific'), '1:44pm');
      assert.equal(EvalCore.templateText({}, '2017-02-16T21:44:02Z',
        'US/Eastern'), '4:44pm');
    });

    it('handles whitespace in ref syntax', () => {
      assert.equal(EvalCore.templateText({num: 123}, '{{ num }}'), '123');
    });

    it('templates refs', () => {
      const context = {
        num: 123,
        str: 'hi there',
        bool: true,
        time: '2017-02-16T21:44:02Z',
        nested: { str: 'rawr' }
      };
      assert.equal(EvalCore.templateText(context, '{{num}}'), '123');
      assert.equal(EvalCore.templateText(context, '{{str}}'), 'hi there');
      assert.equal(EvalCore.templateText(context, '{{bool}}'), 'Yes');
      assert.equal(EvalCore.templateText(context, '{{nothing}}'), '');
      assert.equal(EvalCore.templateText(context, '{{time}}', 'US/Pacific'),
        '1:44pm');
      assert.equal(EvalCore.templateText(context, '{{nested.str}}'), 'rawr');
    });

    it('concatenates', () => {
      assert.equal(EvalCore.templateText({ a: 1, b: 2 }, '{{a}} {{b}}'),
        '1 2');
    });

    it('handles conditionals', () => {
      const context = { a: true, b: false };
      assert.equal(EvalCore.templateText(context,
        '{% if a %}a is true{% endif %}'), 'a is true');
      assert.equal(EvalCore.templateText(context,
        '{% if b %}b is true{% endif %}'), '');
      assert.equal(EvalCore.templateText(context,
        '{%if a%}a is true{%endif%}'), 'a is true');
      assert.equal(EvalCore.templateText(context,
        '{%if b%}b is true{%endif%}'), '');
    });

    it('handles conditionals with else clause', () => {
      const context = { a: 1, b: 0 };
      assert.equal(EvalCore.templateText(context,
        '{% if a %}a is true{% else %}a is not true{% endif %}'),
      'a is true');
      assert.equal(EvalCore.templateText(context,
        '{% if b %}b is true{% else %}b is not true{% endif %}'),
      'b is not true');
      assert.equal(EvalCore.templateText(context,
        '{% if c %}c is true{% else %}c is not true{% endif %}'),
      'c is not true');
    });

    it('handles conditionals with interpolations', () => {
      const context = {
        flag_horseride: true,
        schedule: {
          'TIME-09-HORSERIDE': '2017-02-16T23:00:02Z',
          'TIME-11-DUSTIN-MEET': '2017-02-16T23:45:02Z'
        }
      };
      const msg = '{% if flag_horseride %}Get to Five Brooks for a {{schedule.TIME-09-HORSERIDE}} ride.{% else %}Meet Dustin at Five Brooks at {{schedule.TIME-11-DUSTIN-MEET}}.{% endif %}';
      assert.equal(EvalCore.templateText(context, msg, 'US/Pacific'),
        'Get to Five Brooks for a 3:00pm ride.');
      context.flag_horseride = false;
      assert.equal(EvalCore.templateText(context, msg, 'US/Pacific'),
        'Meet Dustin at Five Brooks at 3:45pm.');
    });
  });
});
