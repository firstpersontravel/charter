const assert = require('assert');
const sinon = require('sinon');

const TemplateUtil = require('../../src/utils/template').default;

const sandbox = sinon.sandbox.create();

describe('TemplateUtil', () => {
  afterEach(() => {
    sandbox.restore();
  });

  describe('#lookupRef', () => {
    it('handles true constants', () => {
      assert.strictEqual(TemplateUtil.lookupRef({}, true), true);
      assert.strictEqual(TemplateUtil.lookupRef({}, false), false);
      assert.strictEqual(TemplateUtil.lookupRef({}, null), null);
    });

    it('handles string constants', () => {
      assert.strictEqual(TemplateUtil.lookupRef({}, 'true'), true);
      assert.strictEqual(TemplateUtil.lookupRef({}, 'false'), false);
      assert.strictEqual(TemplateUtil.lookupRef({}, 'null'), null);
    });

    it('handles true numbers', () => {
      assert.strictEqual(TemplateUtil.lookupRef({}, 1), 1);
      assert.strictEqual(TemplateUtil.lookupRef({}, -10), -10);
      assert.strictEqual(TemplateUtil.lookupRef({}, 1.5), 1.5);
    });

    it('handles string numbers', () => {
      assert.strictEqual(TemplateUtil.lookupRef({}, '1'), 1);
      assert.strictEqual(TemplateUtil.lookupRef({}, '-10'), -10);
      assert.strictEqual(TemplateUtil.lookupRef({}, '1.5'), 1.5);
    });

    it('returns null for non-string non-constants', () => {
      assert.strictEqual(TemplateUtil.lookupRef({}, { object: 1 }), null);
      assert.strictEqual(TemplateUtil.lookupRef({}, [1]), null);
    });

    it('handles strings', () => {
      assert.strictEqual(TemplateUtil.lookupRef({}, '"string"'), 'string');
      assert.strictEqual(TemplateUtil.lookupRef({}, '\'string\''), 'string');
      assert.strictEqual(TemplateUtil.lookupRef({}, '\'s_0_f934tg-@$#T$*R\''),
        's_0_f934tg-@$#T$*R');
      assert.strictEqual(TemplateUtil.lookupRef({}, '"A string with spaces and characters, yah?"'), 'A string with spaces and characters, yah?');
      assert.strictEqual(TemplateUtil.lookupRef({}, '\'A string with spaces and characters, yah?\''), 'A string with spaces and characters, yah?');
    });

    it('handles refs', () => {
      assert.strictEqual(TemplateUtil.lookupRef({ a: 'test' }, 'a'), 'test');
      assert.strictEqual(TemplateUtil.lookupRef({ a: true }, 'a'), true);
      assert.strictEqual(TemplateUtil.lookupRef({ a: null }, 'a'), null);
      assert.strictEqual(TemplateUtil.lookupRef({ a: true }, 'c'), null);
      assert.strictEqual(TemplateUtil.lookupRef(
        { a: { b: 'test.test' } }, 'a.b'), 'test.test');
      assert.strictEqual(TemplateUtil.lookupRef(
        { a: { b: 'test.test' } }, 'a.c'), null);
    });

    it('handles refs by role', () => {
      const evalContext = { roleStates: { role2: [{ abc: 123 }] } };
      assert.strictEqual(TemplateUtil.lookupRef(
        evalContext, 'player.abc', 'role2'), 123);
      assert.strictEqual(TemplateUtil.lookupRef(
        evalContext, 'player.abc', 'role1'), null);
      assert.strictEqual(TemplateUtil.lookupRef(
        evalContext, 'player.abc', null), null);
    });
  });

  describe('#templateText', () => {
    it('templates constants', () => {
      assert.equal(TemplateUtil.templateText({}, null), '');
      assert.equal(TemplateUtil.templateText({}, undefined), '');
      assert.equal(TemplateUtil.templateText({}, false), 'No');
      assert.equal(TemplateUtil.templateText({}, true), 'Yes');
    });

    it('templates numbers', () => {
      assert.equal(TemplateUtil.templateText({}, 2), '2');
      assert.equal(TemplateUtil.templateText({}, 2.1), '2.1');
    });

    it('templates timestamps', () => {
      assert.equal(TemplateUtil.templateText({}, '2017-02-16T21:44:02Z',
        'US/Pacific'), '1:44pm');
      assert.equal(TemplateUtil.templateText({}, '2017-02-16T21:44:02Z',
        'US/Eastern'), '4:44pm');
    });

    it('handles whitespace in ref syntax', () => {
      assert.equal(TemplateUtil.templateText({num: 123}, '{{ num }}'), '123');
    });

    it('templates refs', () => {
      const context = {
        num: 123,
        str: 'hi there',
        bool: true,
        time: '2017-02-16T21:44:02Z',
        nested: { str: 'rawr' }
      };
      assert.equal(TemplateUtil.templateText(context, '{{num}}'), '123');
      assert.equal(TemplateUtil.templateText(context, '{{str}}'), 'hi there');
      assert.equal(TemplateUtil.templateText(context, '{{bool}}'), 'Yes');
      assert.equal(TemplateUtil.templateText(context, '{{nothing}}'), '');
      assert.equal(TemplateUtil.templateText(context, '{{time}}', 'US/Pacific'),
        '1:44pm');
      assert.equal(TemplateUtil.templateText(context, '{{nested.str}}'), 'rawr');
    });

    it('concatenates', () => {
      assert.equal(TemplateUtil.templateText({ a: 1, b: 2 }, '{{a}} {{b}}'),
        '1 2');
    });

    it('handles conditionals', () => {
      const context = { a: true, b: false };
      assert.equal(TemplateUtil.templateText(context,
        '{% if a %}a is true{% endif %}'), 'a is true');
      assert.equal(TemplateUtil.templateText(context,
        '{% if b %}b is true{% endif %}'), '');
      assert.equal(TemplateUtil.templateText(context,
        '{%if a%}a is true{%endif%}'), 'a is true');
      assert.equal(TemplateUtil.templateText(context,
        '{%if b%}b is true{%endif%}'), '');
    });

    it('handles conditionals with else clause', () => {
      const context = { a: 1, b: 0 };
      assert.equal(TemplateUtil.templateText(context,
        '{% if a %}a is true{% else %}a is not true{% endif %}'),
      'a is true');
      assert.equal(TemplateUtil.templateText(context,
        '{% if b %}b is true{% else %}b is not true{% endif %}'),
      'b is not true');
      assert.equal(TemplateUtil.templateText(context,
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
      assert.equal(TemplateUtil.templateText(context, msg, 'US/Pacific'),
        'Get to Five Brooks for a 3:00pm ride.');
      context.flag_horseride = false;
      assert.equal(TemplateUtil.templateText(context, msg, 'US/Pacific'),
        'Meet Dustin at Five Brooks at 3:45pm.');
    });

    it('templates with role', () => {
      const evalContext = {
        roleStates: { role1: [{ color: 'red' }] }
      };
      const text = 'My fave color is {{player.color}}.';
      assert.equal(
        TemplateUtil.templateText(evalContext, text, 'US/Pacific', 'role1'),
        'My fave color is red.');
      assert.equal(
        TemplateUtil.templateText(evalContext, text, 'US/Pacific', null),
        'My fave color is .');
    });
  });
});
