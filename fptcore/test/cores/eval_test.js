const assert = require('assert');
const sinon = require('sinon');

const EvalCore = require('../../src/cores/eval');

const sandbox = sinon.sandbox.create();

describe('EvalCore', () => {
  afterEach(() => {
    sandbox.restore();
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
