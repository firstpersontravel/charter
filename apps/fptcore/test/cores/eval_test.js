const _ = require('lodash');
const assert = require('assert');
const sinon = require('sinon');

const EvalCore = require('../../src/cores/eval');

const sandbox = sinon.sandbox.create();

describe('EvalCore', () => {

  afterEach(() => {
    sandbox.restore();
  });

  const env = {
    host: 'https://test.test'
  };

  describe('#gatherPlayerContext', () => {
    it('gathers values from player', () => {
      const player = {
        id: 10,
        roleName: 'Vance',
        currentPageName: 'PAGE-NAME',
        user: {
          firstName: 'Vance',
          lastName: 'Farraday'
        }
      };
      const expected = {
        id: 10,
        currentPageName: 'PAGE-NAME',
        link: 'https://test.test/s/10',
        contact_name: 'Vance',
        photo: null,
        facetime: null,
        phone_number: null,
        directive: null,
        skype: null
      };
      const result = EvalCore.gatherPlayerContext(
        env, { id: 1, script: { name: 'test' } }, player);
      assert.deepEqual(result, expected);
    });

    it('gathers directive from script', () => {
      const trip = {
        script: {
          content: {
            pages: [{
              name: 'OTHER-PAGE-NAME',
              directive: 'Go to the Armory'
            }, {
              name: 'PAGE-NAME',
              directive: 'Go to the Tavern'
            }]
          }
        }
      };
      const player = {
        currentPageName: 'PAGE-NAME'
      };
      const result = EvalCore.gatherPlayerContext(env, trip, player);
      assert.equal(result.directive, 'Go to the Tavern');
    });

    it('gathers values from user', () => {
      const player = {
        roleName: 'Dustin',
        user: {
          phoneNumber: '1234567890',
          profile: {
            photo: 'dustin.jpg',
            facetimeUsername: 'dustin'
          }
        }
      };
      const context = { script: { name: 'theheadlandsgamble' } };
      const result = EvalCore.gatherPlayerContext(env, context,
        player);
      assert.equal(result.phone_number, '1234567890');
      assert.equal(result.photo, 'dustin.jpg');
      assert.equal(result.facetime, 'dustin');
    });
  });

  describe('#gatherContext', () => {
    it('gathers all context', () => {
      const trip = {
        currentSceneName: 'SCENE-01',
        schedule: {
          'TIME-123': '2017-02-16T21:44:02Z'
        },
        history: {
          'CUE-123': '2017-02-16T21:44:02Z'
        },
        values: {
          abc: '123'
        },
        players: [{
          roleName: 'Sarai',
          user: {
            id: 3
          }
        }, {
          roleName: 'Vance',
          user: null
        }]
      };

      const saraiValues = { vals: 's' };
      const vanceValues = { vals: 'v' };
      const subcontextStub = sandbox.stub(EvalCore,
        'gatherPlayerContext');
      subcontextStub.onFirstCall().returns(saraiValues);
      subcontextStub.onSecondCall().returns(vanceValues);

      const expected = {
        currentSceneName: 'SCENE-01',
        schedule: trip.schedule,
        history: trip.history,
        abc: '123',
        Sarai: saraiValues,
        Vance: vanceValues
      };

      const result = EvalCore.gatherContext(env, trip);
      assert.deepEqual(result, expected);
      sinon.assert.calledWith(subcontextStub, env, trip, trip.players[0]);
      sinon.assert.calledWith(subcontextStub, env, trip, trip.players[1]);
    });

    it('gathers context from waypoint options', () => {
      const trip = {
        script: {
          content: {
            waypoints: [{
              name: 'waypoint1',
              options: [{
                name: 'option1',
                values: { color: 'red' }
              }, {
                name: 'option2',
                values: { color: 'blue' }
              }]
            }]
          }
        },
        currentSceneName: 'SCENE-01',
        schedule: {},
        history: {},
        values: {
          waypoint_options: {
            waypoint1: 'option1'
          }
        },
        players: []
      };
      // Tests first option
      const res1 = EvalCore.gatherContext(env, trip);
      assert.strictEqual(res1.color, 'red');
      // Tests second option
      trip.values.waypoint_options.waypoint1 = 'option2';
      const res2 = EvalCore.gatherContext(env, trip);
      assert.strictEqual(res2.color, 'blue');
      // Tests empty
      trip.values.waypoint_options.waypoint1 = null;
      const res3 = EvalCore.gatherContext(env, trip);
      assert.strictEqual(_.includes(Object.keys(res3), 'color'), false);
      // Tests bad option
      trip.values.waypoint_options.waypoint1 = 'nonexistent';
      const res4 = EvalCore.gatherContext(env, trip);
      assert.strictEqual(_.includes(Object.keys(res4), 'color'), false);
    });
  });

  describe('#simpleIf', () => {

    it('throw error if invalid if command', () => {
      assert.throws(() => {
        EvalCore.simpleIf({}, 'greaterthan 1 3');
      });
    });

    it('evaluates implicit istrue', () => {
      assert.equal(EvalCore.simpleIf({ v: true }, 'v'), true);
      assert.equal(EvalCore.simpleIf({ v: 1 }, 'v'), true);
      assert.equal(EvalCore.simpleIf({ v: '1' }, 'v'), true);
      assert.equal(EvalCore.simpleIf({ v: 'true' }, 'v'), true);
      assert.equal(EvalCore.simpleIf({ v: false }, 'v'), false);
      assert.equal(EvalCore.simpleIf({ v: 0 }, 'v'), false);
      assert.equal(EvalCore.simpleIf({ v: null }, 'v'), false);
      assert.equal(EvalCore.simpleIf({}, 'v'), false);
    });

    it('evaluates explicit istrue', () => {
      assert.equal(EvalCore.simpleIf({ v: true }, 'istrue v'), true);
      assert.equal(EvalCore.simpleIf({ v: 1 }, 'istrue v'), true);
      assert.equal(EvalCore.simpleIf({ v: '1' }, 'istrue v'), true);
      assert.equal(EvalCore.simpleIf({ v: 'true' }, 'istrue v'), true);
      assert.equal(EvalCore.simpleIf({ v: false }, 'istrue v'), false);
      assert.equal(EvalCore.simpleIf({ v: 0 }, 'istrue v'), false);
      assert.equal(EvalCore.simpleIf({ v: null }, 'istrue v'), false);
      assert.equal(EvalCore.simpleIf({}, 'istrue v'), false);
    });

    it('evaluates explicit not', () => {
      assert.equal(EvalCore.simpleIf({ v: true }, 'not v'), false);
      assert.equal(EvalCore.simpleIf({ v: 1 }, 'not v'), false);
      assert.equal(EvalCore.simpleIf({ v: '1' }, 'not v'), false);
      assert.equal(EvalCore.simpleIf({ v: 'true' }, 'not v'), false);
      assert.equal(EvalCore.simpleIf({ v: false }, 'not v'), true);
      assert.equal(EvalCore.simpleIf({ v: 0 }, 'not v'), true);
      assert.equal(EvalCore.simpleIf({ v: null }, 'not v'), true);
      assert.equal(EvalCore.simpleIf({}, 'not v'), true);
    });

    it('evaluates equals with constants', () => {
      assert.equal(EvalCore.simpleIf({}, 'equals "2" "2"'), true);
      assert.equal(EvalCore.simpleIf({}, 'equals 1 1'), true);
      assert.equal(EvalCore.simpleIf({}, 'equals true true'), true);
      assert.equal(EvalCore.simpleIf({}, 'equals "2" "1"'), false);
      assert.equal(EvalCore.simpleIf({}, 'equals 1 0'), false);
      assert.equal(EvalCore.simpleIf({}, 'equals 5 true'), false);
    });

    it('evaluates equals with constant and var', () => {
      assert.equal(EvalCore.simpleIf({ v: '2' }, 'equals v "2"'), true);
      assert.equal(EvalCore.simpleIf({ v: 1 }, 'equals v 1'), true);
      assert.equal(EvalCore.simpleIf({ v: true }, 'equals v true'), true);
      assert.equal(EvalCore.simpleIf({ v: null }, 'equals v null'), true);
      assert.equal(EvalCore.simpleIf({ v: '2' }, 'equals v "1"'), false);
      assert.equal(EvalCore.simpleIf({ v: 1 }, 'equals v "1"'), false);
      assert.equal(EvalCore.simpleIf({ v: 1 }, 'equals v 0'), false);
      assert.equal(EvalCore.simpleIf({ v: false }, 'equals v true'), false);
      assert.equal(EvalCore.simpleIf({ v: false }, 'equals v null'), false);
      assert.equal(EvalCore.simpleIf({ v: 'true' }, 'equals v true'), false);
    });

    it('evaluates equals with var and var', () => {
      assert.equal(EvalCore.simpleIf({ a: true, b: true }, 'equals a b'),
        true);
      assert.equal(EvalCore.simpleIf({ a: false, b: false }, 'equals a b'),
        true);
      assert.equal(EvalCore.simpleIf({ a: 1, b: 1 }, 'equals a b'), true);
      assert.equal(EvalCore.simpleIf({ a: '1', b: '1' }, 'equals a b'), true);
      assert.equal(EvalCore.simpleIf({ a: 2, b: 1 }, 'equals a b'), false);
      assert.equal(EvalCore.simpleIf({ a: '1', b: 1 }, 'equals a b'), false);
      assert.equal(EvalCore.simpleIf({ a: '1', b: '2' }, 'equals a b'), false);
    });

    it('evaluates not equals with constants', () => {
      assert.equal(EvalCore.simpleIf({}, 'not equals "2" "2"'), false);
      assert.equal(EvalCore.simpleIf({}, 'not equals 1 1'), false);
      assert.equal(EvalCore.simpleIf({}, 'not equals true true'), false);
      assert.equal(EvalCore.simpleIf({}, 'not equals "2" "1"'), true);
      assert.equal(EvalCore.simpleIf({}, 'not equals 1 0'), true);
      assert.equal(EvalCore.simpleIf({}, 'not equals 5 true'), true);
    });

    it('evaluates nested objects', () => {
      assert.equal(EvalCore.simpleIf({ a: { b: '2' } }, 'equals a.b "2"'),
        true);
      assert.equal(EvalCore.simpleIf({ a: { b: '2' } }, 'equals "2" a.b'),
        true);
      assert.equal(EvalCore.simpleIf({ a: { b: '2' } }, 'a.b'), true);
      assert.equal(EvalCore.simpleIf({ a: { b: '2' } }, 'a.c'), false);
      assert.equal(EvalCore.simpleIf({ a: { b: '2' } }, 'not a.b'), false);
      assert.equal(EvalCore.simpleIf({ a: { b: '2' } }, 'not a.c'), true);
    });

    it('evaluates contains', () => {
      assert.equal(EvalCore.simpleIf(
        { a: 'A sIMPle THING', b: 'simple' }, 'contains a b'), true);
      assert.equal(EvalCore.simpleIf(
        { a: 'a simple man', b: 'simple' }, 'contains a b'), true);
      assert.equal(EvalCore.simpleIf(
        { a: 'a simple man', b: 'car' }, 'contains a b'), false);
      assert.equal(EvalCore.simpleIf(
        { b: 'house' }, 'contains "my house" b'), true);
      assert.equal(EvalCore.simpleIf(
        { a: 'a simple man'}, 'contains a "car"'), false);
    });

    it('evaluates not contains', () => {
      assert.equal(EvalCore.simpleIf(
        { a: 'A sIMPle THING', b: 'simple' }, 'not contains a b'), false);
      assert.equal(EvalCore.simpleIf(
        { a: 'a simple man', b: 'simple' }, 'not contains a b'), false);
      assert.equal(EvalCore.simpleIf(
        { a: 'a simple man', b: 'car' }, 'not contains a b'), true);
      assert.equal(EvalCore.simpleIf(
        { b: 'house' }, 'not contains "MY HOUSE" b'), false);
      assert.equal(EvalCore.simpleIf(
        { a: 'a simple man'}, 'not contains a "car"'), true);
    });

    it('evaluates matches', () => {
      assert.equal(EvalCore.simpleIf(
        { a: '9144844223', }, 'matches a "^\\d{10}$"'), true);
      assert.equal(EvalCore.simpleIf(
        { a: '91448442233', }, 'matches a "^\\d{10}$"'), false);
      assert.equal(EvalCore.simpleIf(
        { a: '914484422', }, 'matches a "^\\d{10}$"'), false);
      assert.equal(EvalCore.simpleIf(
        { a: 'abcd', }, 'matches a "^[a-d]+$"'), true);
      assert.equal(EvalCore.simpleIf(
        { a: 'abcde', }, 'matches a "^[a-d]+$"'), false);
    });

    it('evaluates not matches', () => {
      assert.equal(EvalCore.simpleIf(
        { a: '9144844223', }, 'not matches a "^\\d{10}$"'), false);
      assert.equal(EvalCore.simpleIf(
        { a: '91448442233', }, 'not matches a "^\\d{10}$"'), true);
      assert.equal(EvalCore.simpleIf(
        { a: '914484422', }, 'not matches a "^\\d{10}$"'), true);
      assert.equal(EvalCore.simpleIf(
        { a: 'abcd', }, 'not matches a "^[a-d]+$"'), false);
      assert.equal(EvalCore.simpleIf(
        { a: 'abcde', }, 'not matches a "^[a-d]+$"'), true);
    });
  });

  describe('#if', () => {
    it('evaluates simple ifs', () => {
      assert.equal(EvalCore.if({ v: '2' }, 'equals v "2"'), true);
      assert.equal(EvalCore.if({ a: 2, b: 2 }, 'a'), true);
      assert.equal(EvalCore.if({ a: 2, b: 2 }, 'c'), false);
      assert.equal(EvalCore.if({ a: 2, b: 2 }, 'istrue b'), true);
      assert.equal(EvalCore.if({ a: 1, b: 2 }, 'equals a b'), false);
      assert.equal(EvalCore.if({ v: 1 }, 'not equals v 1'), false);
    });

    it('evaluates boolean ors', () => {
      const context = { a: 1, b: 1, c: 2, d: 2, x: { y: 1, z: 2 } };
      assert.equal(EvalCore.if(context, { or: ['e', 'f'] }), false);
      assert.equal(EvalCore.if(context, { or: ['x.y', 'x.z'] }), true);
      assert.equal(EvalCore.if(context, { or: ['x.y', 'x.x'] }), true);
      assert.equal(EvalCore.if(context, { or: ['x.w', 'x.x'] }), false);
      assert.equal(EvalCore.if(context, { or: ['equals a b', 'equals c d'] }),
        true);
      assert.equal(EvalCore.if(context, { or: ['equals a b', 'equals a c'] }),
        true);
      assert.equal(EvalCore.if(context, { or: ['equals a c', 'equals b d'] }),
        false);
    });

    it('evaluates boolean ands', () => {
      const context = { a: 1, b: 1, c: 2, d: 2, x: { y: 1, z: 2 } };
      assert.equal(EvalCore.if(context, ['e', 'f']), false);
      assert.equal(EvalCore.if(context, ['e', 'd']), false);
      assert.equal(EvalCore.if(context, ['a', 'd']), true);
      assert.equal(EvalCore.if(context, ['x.y', 'x.z']), true);
      assert.equal(EvalCore.if(context, ['x.y', 'x.x']), false);
      assert.equal(EvalCore.if(context, ['x.w', 'x.x']), false);
      assert.equal(EvalCore.if(context, ['equals a b', 'equals c d']), true);
      assert.equal(EvalCore.if(context, ['equals a b', 'equals a c']), false);
      assert.equal(EvalCore.if(context, ['equals a c', 'equals b d']), false);
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

    it('handles conditionals with complex statements', () => {
      const context = { a: 3, b: 4 };
      assert.equal(EvalCore.templateText(context,
        '{% if equals a 3 %}a is 3{% endif %}'), 'a is 3');
      assert.equal(EvalCore.templateText(context,
        '{% if equals a 4 %}a is 4{% endif %}'), '');
      assert.equal(EvalCore.templateText(context,
        '{% if equals a "3" %}a is 4{% endif %}'), '');
      assert.equal(EvalCore.templateText(context,
        '{% if not equals b 5 %}b is not 5{% endif %}'), 'b is not 5');
      assert.equal(EvalCore.templateText(context,
        '{% if not equals b 4 %}b is not 4 {% endif %}'), '');
      assert.equal(EvalCore.templateText(context,
        '{% if not c %}not c{% endif %}'), 'not c');
      assert.equal(EvalCore.templateText(context,
        '{% if not b %}b{% endif %}'), '');
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
      assert.equal(EvalCore.templateText(context,
        '{% if equals a 1 %}a is 1{% else %}a is not 1{% endif %}'),
      'a is 1');
      assert.equal(EvalCore.templateText(context,
        '{% if equals a 3 %}a is 3{% else %}a is not 3{% endif %}'),
      'a is not 3');
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
