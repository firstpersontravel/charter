const assert = require('assert');
const sinon = require('sinon');

const EvalCore = require('../../src/cores/eval');

const sandbox = sinon.sandbox.create();

describe('EvalCore', () => {

  afterEach(() => {
    sandbox.restore();
  });

  describe('#parseParens', () => {
    it('parses paren statements', () => {
      assert.deepStrictEqual(
        EvalCore.parseParens('(a b c and d e f) or (1 2 3)'),
        [['a', 'b', 'c', 'and', 'd', 'e', 'f'], 'or', ['1', '2', '3']]);
      assert.deepStrictEqual(
        EvalCore.parseParens('( ( a and b)  or  ( 3 4 5 )) three'),
        [[['a', 'and', 'b'], 'or', ['3', '4', '5']], 'three']);
      assert.deepStrictEqual(
        EvalCore.parseParens('1 2 "3"'),
        ['1', '2', '"3"']);
      assert.deepStrictEqual(
        EvalCore.parseParens('a b () c'),
        ['a', 'b', [], 'c']);
    });

    it('respects quotes', () => {
      assert.deepStrictEqual(
        EvalCore.parseParens('a and "c d e" f'),
        ['a', 'and', '"c d e"', 'f']);
      assert.deepStrictEqual(
        EvalCore.parseParens('(a and) "c d e" f ("g")'),
        [['a', 'and'], '"c d e"', 'f', ['"g"']]);
      assert.deepStrictEqual(
        EvalCore.parseParens('a b "()" c'),
        ['a', 'b', '"()"', 'c']);
    });

    it('handles unended quote', () => {
      assert.deepStrictEqual(
        EvalCore.parseParens('a and "c d e f'),
        ['a', 'and', '"c d e f']);
    });
  });

  describe('#breakWordList', () => {
    it('breaks word lists', () => {
      assert.deepStrictEqual(
        EvalCore.breakWordList(['a', 'and', 'b', 'c', 'and', 'd'], 'and'),
        [['a'], ['b', 'c'], ['d']]);
      assert.deepStrictEqual(
        EvalCore.breakWordList(['or', 'c', 'c', 'or', 'f'], 'or'),
        [[], ['c', 'c'], ['f']]);
      assert.deepStrictEqual(
        EvalCore.breakWordList(['x', 'x', 'x'], 'x'),
        [[], [], [], []]);
    });
  });

  describe('#evalWords', () => {
    function assertEvalEquals(ctx, stmt, val) {
      assert.strictEqual(EvalCore.evalWords(ctx, stmt), val);
    }

    it('throw error if invalid if command', () => {
      assert.throws(() => {
        EvalCore.evalWords({}, 'greaterthan 1 3');
      });
    });

    it('evaluates implicit istrue', () => {
      var stmt = ['v'];
      assertEvalEquals({ v: true }, stmt, true);
      assertEvalEquals({ v: 1 }, stmt, true);
      assertEvalEquals({ v: '1' }, stmt, true);
      assertEvalEquals({ v: 'true' }, stmt, true);
      assertEvalEquals({ v: false }, stmt, false);
      assertEvalEquals({ v: 0 }, stmt, false);
      assertEvalEquals({ v: null }, stmt, false);
      assertEvalEquals({}, stmt, false);
    });

    it('evaluates explicit istrue', () => {
      var stmt = ['istrue', 'v'];
      assertEvalEquals({ v: true }, stmt, true);
      assertEvalEquals({ v: 1 }, stmt, true);
      assertEvalEquals({ v: '1' }, stmt, true);
      assertEvalEquals({ v: 'true' }, stmt, true);
      assertEvalEquals({ v: false }, stmt, false);
      assertEvalEquals({ v: 0 }, stmt, false);
      assertEvalEquals({ v: null }, stmt, false);
      assertEvalEquals({}, stmt, false);
    });

    it('evaluates explicit not', () => {
      var stmt = ['not', 'v'];
      assertEvalEquals({ v: true }, stmt, false);
      assertEvalEquals({ v: 1 }, stmt, false);
      assertEvalEquals({ v: '1' }, stmt, false);
      assertEvalEquals({ v: 'true' }, stmt, false);
      assertEvalEquals({ v: false }, stmt, true);
      assertEvalEquals({ v: 0 }, stmt, true);
      assertEvalEquals({ v: null }, stmt, true);
      assertEvalEquals({}, stmt, true);
    });

    it('evaluates equals with constants', () => {
      assertEvalEquals({}, ['equals', '"2"', '"2"'], true);
      assertEvalEquals({}, ['equals', '1', '1'], true);
      assertEvalEquals({}, ['equals', 'true', 'true'], true);
      assertEvalEquals({}, ['equals', '"2"', '"1"'], false);
      assertEvalEquals({}, ['equals', '1', '0'], false);
      assertEvalEquals({}, ['equals', '5', 'true'], false);
    });

    it('evaluates equals with constant and var', () => {
      assertEvalEquals({ v: '2' }, ['equals', 'v', '"2"'], true);
      assertEvalEquals({ v: 1 }, ['equals', 'v', '1'], true);
      assertEvalEquals({ v: true }, ['equals', 'v', 'true'], true);
      assertEvalEquals({ v: null }, ['equals', 'v', 'null'], true);
      assertEvalEquals({ v: '2' }, ['equals', 'v', '"1"'], false);
      assertEvalEquals({ v: 1 }, ['equals', 'v', '"1"'], false);
      assertEvalEquals({ v: 1 }, ['equals', 'v', '0'], false);
      assertEvalEquals({ v: false }, ['equals', 'v', 'true'], false);
      assertEvalEquals({ v: false }, ['equals', 'v', 'null'], false);
      assertEvalEquals({ v: 'true' }, ['equals', 'v', 'true'], false);
    });

    it('evaluates equals with var and var', () => {
      const stmt = ['equals', 'a', 'b'];
      assertEvalEquals({ a: true, b: true }, stmt, true);
      assertEvalEquals({ a: false, b: false }, stmt, true);
      assertEvalEquals({ a: 1, b: 1 }, stmt, true);
      assertEvalEquals({ a: '1', b: '1' }, stmt, true);
      assertEvalEquals({ a: 2, b: 1 }, stmt, false);
      assertEvalEquals({ a: '1', b: 1 }, stmt, false);
      assertEvalEquals({ a: '1', b: '2' }, stmt, false);
    });

    it('evaluates not equals with constants', () => {
      assertEvalEquals({}, ['not', 'equals', '"2"', '"2"'], false);
      assertEvalEquals({}, ['not', 'equals', '1', '1'], false);
      assertEvalEquals({}, ['not', 'equals', 'true', 'true'], false);
      assertEvalEquals({}, ['not', 'equals', '"2"', '"1"'], true);
      assertEvalEquals({}, ['not', 'equals', '1', '0'], true);
      assertEvalEquals({}, ['not', 'equals', '5', 'true'], true);
    });

    it('evaluates nested objects', () => {
      assertEvalEquals({ a: { b: '2' } }, ['equals', 'a.b', '"2"'], true);
      assertEvalEquals({ a: { b: '2' } }, ['equals', '"2"', 'a.b'], true);
      assertEvalEquals({ a: { b: '2' } }, ['a.b'], true);
      assertEvalEquals({ a: { b: '2' } }, ['a.c'], false);
      assertEvalEquals({ a: { b: '2' } }, ['not', 'a.b'], false);
      assertEvalEquals({ a: { b: '2' } }, ['not', 'a.c'], true);
    });

    it('evaluates contains', () => {
      assertEvalEquals({ a: 'A sIMPle THING', b: 'simple' },
        ['contains', 'a', 'b'], true);
      assertEvalEquals({ a: 'a simple man', b: 'simple' },
        ['contains', 'a', 'b'], true);
      assertEvalEquals({ a: 'a simple man', b: 'car' },
        ['contains', 'a', 'b'], false);
      assertEvalEquals({ b: 'house' },
        ['contains', '"my house"', 'b'], true);
      assertEvalEquals({ a: 'a simple man'},
        ['contains', 'a', '"car"'], false);
    });

    it('evaluates not contains', () => {
      assertEvalEquals({ a: 'A sIMPle THING', b: 'simple' },
        ['not', 'contains', 'a', 'b'], false);
      assertEvalEquals({ a: 'a simple man', b: 'simple' },
        ['not', 'contains', 'a', 'b'], false);
      assertEvalEquals({ a: 'a simple man', b: 'car' },
        ['not', 'contains', 'a', 'b'], true);
      assertEvalEquals({ b: 'house' },
        ['not', 'contains', '"MY HOUSE"', 'b'], false);
      assertEvalEquals({ a: 'a simple man'},
        ['not', 'contains', 'a', '"car"'], true);
    });

    it('evaluates matches', () => {
      assertEvalEquals({ a: '9144844223', }, ['matches', 'a', '"^\\d{10}$"'], true);
      assertEvalEquals({ a: '91448442233', }, ['matches', 'a', '"^\\d{10}$"'], false);
      assertEvalEquals({ a: '914484422', }, ['matches', 'a', '"^\\d{10}$"'], false);
      assertEvalEquals({ a: 'abcd', }, ['matches', 'a', '"^[a-d]+$"'], true);
      assertEvalEquals({ a: 'abcde', }, ['matches', 'a', '"^[a-d]+$"'], false);
    });

    it('evaluates not matches', () => {
      assertEvalEquals({ a: '9144844223', },
        ['not', 'matches', 'a', '"^\\d{10}$"'], false);
      assertEvalEquals({ a: '91448442233', },
        ['not', 'matches', 'a', '"^\\d{10}$"'], true);
      assertEvalEquals({ a: '914484422', },
        ['not', 'matches', 'a', '"^\\d{10}$"'], true);
      assertEvalEquals({ a: 'abcd', },
        ['not', 'matches', 'a', '"^[a-d]+$"'], false);
      assertEvalEquals({ a: 'abcde', },
        ['not', 'matches', 'a', '"^[a-d]+$"'], true);
    });
  });

  describe('#evalNestedWords', () => {
    function assertEvalEquals(ctx, stmt, val) {
      assert.deepStrictEqual(EvalCore.evalNestedWords(ctx, stmt), val);
    }

    it('evals empty', () => {
      assertEvalEquals({}, [], false);
    });

    it('evals one item', () => {
      assertEvalEquals({ a: 1 }, ['a'], true);
      assertEvalEquals({ a: 0 }, ['a'], false);
    });

    it('evals nested list', () => {
      assertEvalEquals({ a: 1 }, [['a']], true);
      assertEvalEquals({ a: 0 }, [['a']], false);
      assertEvalEquals({ a: 1 }, [[['a']]], true);
      assertEvalEquals({ a: 0 }, [[['a']]], false);
    });

    it('evals or', () => {
      assertEvalEquals({ a: 1, b: 1 }, ['a', 'or', 'b'], true);
      assertEvalEquals({ a: 1, b: 0 }, ['a', 'or', 'b'], true);
      assertEvalEquals({ a: 0, b: 1 }, ['a', 'or', 'b'], true);
      assertEvalEquals({ a: 0, b: 0 }, ['a', 'or', 'b'], false);
    });

    it('evals and', () => {
      assertEvalEquals({ a: 1, b: 1 }, ['a', 'and', 'b'], true);
      assertEvalEquals({ a: 1, b: 0 }, ['a', 'and', 'b'], false);
      assertEvalEquals({ a: 0, b: 1 }, ['a', 'and', 'b'], false);
      assertEvalEquals({ a: 0, b: 0 }, ['a', 'and', 'b'], false);
    });

    it('evals nested ors and ands', () => {
      const stmt = [['a', 'and', 'b'], 'or', 'c'];
      assertEvalEquals({ a: 1, b: 1, c: 0 }, stmt, true);
      assertEvalEquals({ a: 1, b: 0, c: 0 }, stmt, false);
      assertEvalEquals({ a: 1, b: 1, c: 1 }, stmt, true);
      assertEvalEquals({ a: 0, b: 0, c: 1 }, stmt, true);
      const stmt2 = [['a', 'or', 'b'], 'and', 'c'];
      assertEvalEquals({ a: 1, b: 1, c: 0 }, stmt2, false);
      assertEvalEquals({ a: 1, b: 0, c: 0 }, stmt2, false);
      assertEvalEquals({ a: 1, b: 1, c: 1 }, stmt2, true);
      assertEvalEquals({ a: 0, b: 0, c: 1 }, stmt2, false);
    });

    it('evals nested nots, ors and ands', () => {
      const stmt = [['a', 'and', 'not', 'b'], 'or', 'c'];
      assertEvalEquals({ a: 1, b: 1, c: 0 }, stmt, false);
      assertEvalEquals({ a: 1, b: 0, c: 0 }, stmt, true);
      assertEvalEquals({ a: 1, b: 1, c: 1 }, stmt, true);
      assertEvalEquals({ a: 0, b: 0, c: 0 }, stmt, false);
      const stmt2 = [['not', 'a', 'or', 'b'], 'and', 'not', 'c'];
      assertEvalEquals({ a: 1, b: 1, c: 0 }, stmt2, true);
      assertEvalEquals({ a: 1, b: 0, c: 0 }, stmt2, false);
      assertEvalEquals({ a: 1, b: 1, c: 1 }, stmt2, false);
      assertEvalEquals({ a: 0, b: 0, c: 1 }, stmt2, false);
    });

    it('throws errors for invalid commands', () => {
      const stmt = [['a', 'd', 'and', 'not', 'b'], 'or', 'c'];
      assert.throws(() => EvalCore.evalNestedWords({}, stmt),
        /Invalid if command a\./);
      const stmt2 = [['a', 'and', 'not', 'b'], 'or', 'c', 'd', 'e'];
      assert.throws(() => EvalCore.evalNestedWords({}, stmt2),
        /Invalid if command c\./);
    });

    it('throws error for lists joined without and or or.', () => {
      const stmt = [['istrue', 'a'], ['c']];
      assert.throws(() => EvalCore.evalNestedWords({}, stmt),
        /Lists must be joined by "or" or "and"\./);
    });
  });

  describe('#simpleIf', () => {
    beforeEach(() => {
      sandbox.stub(EvalCore, 'evalWords').returns();
    });

    it('splits words', () => {
      EvalCore.simpleIf({}, 'equals "a car" my.variable');
      sinon.assert.calledWith(EvalCore.evalWords, {},
        ['equals', '"a car"', 'my.variable']);
    });

    it('ignores conjunctives', () => {
      EvalCore.simpleIf({}, 'one and two or three');
      sinon.assert.calledWith(EvalCore.evalWords, {},
        ['one', 'and', 'two', 'or', 'three']);
    });

    it('ignores parens', () => {
      EvalCore.simpleIf({}, 'one and (two or) three');
      sinon.assert.calledWith(EvalCore.evalWords, {},
        ['one', 'and', '(two', 'or)', 'three']);
    });
  });

  describe('#if', () => {
    it('splits words', () => {
      sandbox.stub(EvalCore, 'evalNestedWords').returns();
      EvalCore.if({}, 'one two three');
      sinon.assert.calledWith(EvalCore.evalNestedWords, {},
        ['one', 'two', 'three']);

      EvalCore.if({}, 'one and two and three');
      sinon.assert.calledWith(EvalCore.evalNestedWords, {},
        ['one', 'and', 'two', 'and', 'three']);

      EvalCore.if({}, 'one or two and three');
      sinon.assert.calledWith(EvalCore.evalNestedWords, {},
        ['one', 'or', 'two', 'and', 'three']);
    });

    it('nests with parens', () => {
      sandbox.stub(EvalCore, 'evalNestedWords').returns();
      EvalCore.if({}, 'one (two) three');
      sinon.assert.calledWith(EvalCore.evalNestedWords, {},
        ['one', ['two'], 'three']);

      EvalCore.if({}, '(one and two) and three');
      sinon.assert.calledWith(EvalCore.evalNestedWords, {},
        [['one', 'and', 'two'], 'and', 'three']);

      EvalCore.if({}, 'one or (two and "three four five")');
      sinon.assert.calledWith(EvalCore.evalNestedWords, {},
        ['one', 'or', ['two', 'and', '"three four five"']]);
    });

    it('works with real world example', () => {
      const stmt = '(sent_offer and (contains event.msg.content "y" or contains event.msg.content "ok" or contains event.msg.content "sure"))';
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

  //   it('evaluates simple ifs', () => {
  //     assert.equal(EvalCore.if({ v: '2' }, 'equals v "2"'), true);
  //     assert.equal(EvalCore.if({ a: 2, b: 2 }, 'a'), true);
  //     assert.equal(EvalCore.if({ a: 2, b: 2 }, 'c'), false);
  //     assert.equal(EvalCore.if({ a: 2, b: 2 }, 'istrue b'), true);
  //     assert.equal(EvalCore.if({ a: 1, b: 2 }, 'equals a b'), false);
  //     assert.equal(EvalCore.if({ v: 1 }, 'not equals v 1'), false);
  //   });

  //   it('evaluates boolean ors', () => {
  //     const context = { a: 1, b: 1, c: 2, d: 2, x: { y: 1, z: 2 } };
  //     assert.equal(EvalCore.if(context, 'e or f'), false);
  //     assert.equal(EvalCore.if(context, 'x.y or x.z'), true);
  //     assert.equal(EvalCore.if(context, 'x.y or x.x'), true);
  //     assert.equal(EvalCore.if(context, 'x.w or x.x'), false);
  //     assert.equal(EvalCore.if(context, 'equals a b or equals c d'), true);
  //     assert.equal(EvalCore.if(context, 'equals a b or equals a c'), true);
  //     assert.equal(EvalCore.if(context, 'equals a c or equals b d'), false);
  //   });

  //   it('evaluates boolean ands', () => {
  //     const context = { a: 1, b: 1, c: 2, d: 2, x: { y: 1, z: 2 } };
  //     assert.equal(EvalCore.if(context, 'e and f'), false);
  //     assert.equal(EvalCore.if(context, 'e and d'), false);
  //     assert.equal(EvalCore.if(context, 'a and d'), true);
  //     assert.equal(EvalCore.if(context, 'x.y and x.z'), true);
  //     assert.equal(EvalCore.if(context, 'x.y and x.x'), false);
  //     assert.equal(EvalCore.if(context, 'x.w and x.x'), false);
  //     assert.equal(EvalCore.if(context, 'equals a b and equals c d'), true);
  //     assert.equal(EvalCore.if(context, 'equals a b and equals a c'), false);
  //     assert.equal(EvalCore.if(context, 'equals a c and equals b d'), false);
  //   });
  // });

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

  // describe('#templateText', () => {
  //   it('templates constants', () => {
  //     assert.equal(EvalCore.templateText({}, null), '');
  //     assert.equal(EvalCore.templateText({}, undefined), '');
  //     assert.equal(EvalCore.templateText({}, false), 'No');
  //     assert.equal(EvalCore.templateText({}, true), 'Yes');
  //   });

  //   it('templates numbers', () => {
  //     assert.equal(EvalCore.templateText({}, 2), '2');
  //     assert.equal(EvalCore.templateText({}, 2.1), '2.1');
  //   });

  //   it('templates timestamps', () => {
  //     assert.equal(EvalCore.templateText({}, '2017-02-16T21:44:02Z',
  //       'US/Pacific'), '1:44pm');
  //     assert.equal(EvalCore.templateText({}, '2017-02-16T21:44:02Z',
  //       'US/Eastern'), '4:44pm');
  //   });

  //   it('handles whitespace in ref syntax', () => {
  //     assert.equal(EvalCore.templateText({num: 123}, '{{ num }}'), '123');
  //   });

  //   it('templates refs', () => {
  //     const context = {
  //       num: 123,
  //       str: 'hi there',
  //       bool: true,
  //       time: '2017-02-16T21:44:02Z',
  //       nested: { str: 'rawr' }
  //     };
  //     assert.equal(EvalCore.templateText(context, '{{num}}'), '123');
  //     assert.equal(EvalCore.templateText(context, '{{str}}'), 'hi there');
  //     assert.equal(EvalCore.templateText(context, '{{bool}}'), 'Yes');
  //     assert.equal(EvalCore.templateText(context, '{{nothing}}'), '');
  //     assert.equal(EvalCore.templateText(context, '{{time}}', 'US/Pacific'),
  //       '1:44pm');
  //     assert.equal(EvalCore.templateText(context, '{{nested.str}}'), 'rawr');
  //   });

  //   it('concatenates', () => {
  //     assert.equal(EvalCore.templateText({ a: 1, b: 2 }, '{{a}} {{b}}'),
  //       '1 2');
  //   });

  //   it('handles conditionals', () => {
  //     const context = { a: true, b: false };
  //     assert.equal(EvalCore.templateText(context,
  //       '{% if a %}a is true{% endif %}'), 'a is true');
  //     assert.equal(EvalCore.templateText(context,
  //       '{% if b %}b is true{% endif %}'), '');
  //     assert.equal(EvalCore.templateText(context,
  //       '{%if a%}a is true{%endif%}'), 'a is true');
  //     assert.equal(EvalCore.templateText(context,
  //       '{%if b%}b is true{%endif%}'), '');
  //   });

  //   it('handles conditionals with complex statements', () => {
  //     const context = { a: 3, b: 4 };
  //     assert.equal(EvalCore.templateText(context,
  //       '{% if equals a 3 %}a is 3{% endif %}'), 'a is 3');
  //     assert.equal(EvalCore.templateText(context,
  //       '{% if equals a 4 %}a is 4{% endif %}'), '');
  //     assert.equal(EvalCore.templateText(context,
  //       '{% if equals a "3" %}a is 4{% endif %}'), '');
  //     assert.equal(EvalCore.templateText(context,
  //       '{% if not equals b 5 %}b is not 5{% endif %}'), 'b is not 5');
  //     assert.equal(EvalCore.templateText(context,
  //       '{% if not equals b 4 %}b is not 4 {% endif %}'), '');
  //     assert.equal(EvalCore.templateText(context,
  //       '{% if not c %}not c{% endif %}'), 'not c');
  //     assert.equal(EvalCore.templateText(context,
  //       '{% if not b %}b{% endif %}'), '');
  //   });

  //   it('handles conditionals with else clause', () => {
  //     const context = { a: 1, b: 0 };
  //     assert.equal(EvalCore.templateText(context,
  //       '{% if a %}a is true{% else %}a is not true{% endif %}'),
  //     'a is true');
  //     assert.equal(EvalCore.templateText(context,
  //       '{% if b %}b is true{% else %}b is not true{% endif %}'),
  //     'b is not true');
  //     assert.equal(EvalCore.templateText(context,
  //       '{% if c %}c is true{% else %}c is not true{% endif %}'),
  //     'c is not true');
  //     assert.equal(EvalCore.templateText(context,
  //       '{% if equals a 1 %}a is 1{% else %}a is not 1{% endif %}'),
  //     'a is 1');
  //     assert.equal(EvalCore.templateText(context,
  //       '{% if equals a 3 %}a is 3{% else %}a is not 3{% endif %}'),
  //     'a is not 3');
  //   });

  //   it('handles conditionals with interpolations', () => {
  //     const context = {
  //       flag_horseride: true,
  //       schedule: {
  //         'TIME-09-HORSERIDE': '2017-02-16T23:00:02Z',
  //         'TIME-11-DUSTIN-MEET': '2017-02-16T23:45:02Z'
  //       }
  //     };
  //     const msg = '{% if flag_horseride %}Get to Five Brooks for a {{schedule.TIME-09-HORSERIDE}} ride.{% else %}Meet Dustin at Five Brooks at {{schedule.TIME-11-DUSTIN-MEET}}.{% endif %}';
  //     assert.equal(EvalCore.templateText(context, msg, 'US/Pacific'),
  //       'Get to Five Brooks for a 3:00pm ride.');
  //     context.flag_horseride = false;
  //     assert.equal(EvalCore.templateText(context, msg, 'US/Pacific'),
  //       'Meet Dustin at Five Brooks at 3:45pm.');
  //   });
  // });
});
