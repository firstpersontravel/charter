const sinon = require('sinon');
const assert = require('assert');

const ConditionCore = require('../../src/cores/condition');
const ValidationCore = require('../../src/cores/validation');

const eq = assert.deepStrictEqual;
const ok = (res) => eq(res === undefined ? [] : res, []);
const err = (res, expected) => eq(res, [expected]);

const sandbox = sinon.sandbox.create();

describe('ValidationCore', () => {
  beforeEach(() => {
    sandbox.restore();
  });

  describe('#string', () => {
    it('permits string', () => {
      ok(ValidationCore.string({}, 's', {}, 'abc'));
    });

    it('warns if not a string', () => {
      err(ValidationCore.string({}, 's', {}, []),
        'String param "s" should be a string.');
    });

    it('warns if required and blank', () => {
      ok(ValidationCore.string({}, 's', { required: true }, 'val'));
      err(ValidationCore.string({}, 's', { required: true }, ''),
        'String param "s" should not be blank.');
    });
  });

  describe('#markdown', () => {
    it('permits string', () => {
      ok(ValidationCore.markdown({}, 's', {}, 'abc'));
    });

    it('warns if not a string', () => {
      err(ValidationCore.markdown({}, 's', {}, []),
        'Markdown param "s" should be a string.');
    });

    it('warns if required and blank', () => {
      ok(ValidationCore.markdown({}, 's', { required: true }, 'val'));
      err(ValidationCore.markdown({}, 's', { required: true }, ''),
        'Markdown param "s" should not be blank.');
    });
  });

  describe('#email', () => {
    it('permits email', () => {
      ok(ValidationCore.email({}, 's', {}, 'dispatch@tacosyndicate.family'));
      ok(ValidationCore.email({}, 's', {}, '<test@test.com>'));
    });

    it('permits email and name', () => {
      ok(ValidationCore.email({}, 's', {}, '"Taco Syndicate Dispatch" <dispatch@tacosyndicate.family>'));
      ok(ValidationCore.email({}, 's', {}, 'Taco Syndicate Dispatch <dispatch@tacosyndicate.family>'));
      ok(ValidationCore.email({}, 's', {}, '"Gabe\'s Mom" <a-b-c@d_eF.net>'));
    });


    it('warns if not a string', () => {
      err(ValidationCore.email({}, 's', {}, []),
        'Email param "s" should be a string.');
    });

    it('warns if required and blank', () => {
      ok(ValidationCore.email({}, 's', { required: true }, 'val@val.com'));
      err(ValidationCore.email({}, 's', { required: true }, ''),
        'Email param "s" should not be blank.');
    });

    it('warns if not a valid email', () => {
      err(ValidationCore.email({}, 's', {}, 'asdjsadk'),
        'Email param "s" should be a valid email.');
      err(ValidationCore.email({}, 's', {}, 'abc.com'),
        'Email param "s" should be a valid email.');
      err(ValidationCore.email({}, 's', {}, 'john@domain'),
        'Email param "s" should be a valid email.');
      err(ValidationCore.email({}, 's', {}, '"john@domain"'),
        'Email param "s" should be a valid email.');
      err(ValidationCore.email({}, 's', {}, '<john@domain> "test"'),
        'Email param "s" should be a valid email.');
    });
  });

  describe('#simpleValue', () => {
    it('permits string, number, or boolean', () => {
      ok(ValidationCore.simpleValue({}, 's', {}, 'abc'));
      ok(ValidationCore.simpleValue({}, 's', {}, 123));
      ok(ValidationCore.simpleValue({}, 's', {}, true));
      ok(ValidationCore.simpleValue({}, 's', {}, false));
    });

    it('warns if not a string, number or boolean', () => {
      err(ValidationCore.simpleValue({}, 's', {}, [1]),
        'Simple param "s" should be a string, number or boolean.');
      err(ValidationCore.simpleValue({}, 's', {}, {a: 2}),
        'Simple param "s" should be a string, number or boolean.');
    });

    it('warns if required and blank', () => {
      ok(ValidationCore.simpleValue({}, 's', { required: true }, 'val'));
      err(ValidationCore.simpleValue({}, 's', { required: true }, ''),
        'Simple param "s" should not be blank.');
    });
  });

  describe('#number', () => {
    it('permits string number', () => {
      ok(ValidationCore.number({}, 's', {}, '1'));
    });

    it('permits number', () => {
      ok(ValidationCore.number({}, 's', {}, 1.5));
    });

    it('warns if not a number', () => {
      err(ValidationCore.number({}, 's', {}, 'abc'),
        'Number param "s" should be a number.');
    });
  });

  describe('#coords', () => {
    it('permits valid coords', () => {
      ok(ValidationCore.coords({}, 's', {}, [42, -18.3]));
    });

    it('warns if not an array of length 2', () => {
      err(ValidationCore.coords({}, 's', {}, 2),
        'Coords param "s" should be an array of two numbers.');
      err(ValidationCore.coords({}, 's', {}, []),
        'Coords param "s" should be an array of two numbers.');
      err(ValidationCore.coords({}, 's', {}, [1, 2, 3]),
        'Coords param "s" should be an array of two numbers.');
    });

    it('warns if coords are out of bounds', () => {
      err(ValidationCore.coords({}, 's', {}, [-1000, 0]),
        'Coords param "s[0]" should be between -180 and 180.');
      err(ValidationCore.coords({}, 's', {}, [32, 230]),
        'Coords param "s[1]" should be between -180 and 180.');
    });
  });

  describe('#timeShorthand', () => {
    it('permits valid time shorthand', () => {
      ok(ValidationCore.timeShorthand({}, 's', {}, '1:00pm'));
      ok(ValidationCore.timeShorthand({}, 's', {}, '12:59am'));
      ok(ValidationCore.timeShorthand({}, 's', {}, '+1d 10:23a'));
      ok(ValidationCore.timeShorthand({}, 's', {}, '+4d 12:00p'));
    });

    it('rejects invalid time shorthand', () => {
      err(ValidationCore.timeShorthand({}, 's', {}, '10:00x'),
        'Time shorthand param "s" ("10:00x") must be valid.');
      err(ValidationCore.timeShorthand({}, 's', {}, '23:00pm'),
        'Time shorthand param "s" ("23:00pm") must be valid.');
      err(ValidationCore.timeShorthand({}, 's', {}, '3:99a'),
        'Time shorthand param "s" ("3:99a") must be valid.');
      err(ValidationCore.timeShorthand({}, 's', {}, '-1d 2:00pm'),
        'Time shorthand param "s" ("-1d 2:00pm") must be valid.');
      err(ValidationCore.timeShorthand({}, 's', {}, 'd 2:00pm'),
        'Time shorthand param "s" ("d 2:00pm") must be valid.');
    });
  });

  describe('#timeOffset', () => {
    it('permits valid offsets', () => {
      ok(ValidationCore.timeOffset({}, 's', {}, '1h'));
      ok(ValidationCore.timeOffset({}, 's', {}, '-600.234m'));
      ok(ValidationCore.timeOffset({}, 's', {}, '0s'));
      ok(ValidationCore.timeOffset({}, 's', {}, '120s'));
    });

    it('rejects invalid time offsets', () => {
      err(ValidationCore.timeOffset({}, 's', {}, 'h'),
        'Time offset param "s" ("h") should be a number suffixed by "h/m/s".');
      err(ValidationCore.timeOffset({}, 's', {}, '10x'),
        'Time offset param "s" ("10x") should be a number suffixed by "h/m/s".');
      err(ValidationCore.timeOffset({}, 's', {}, '1_345s'),
        'Time offset param "s" ("1_345s") should be a number suffixed by "h/m/s".');
      err(ValidationCore.timeOffset({}, 's', {}, '1.2.3m'),
        'Time offset param "s" ("1.2.3m") should be a number suffixed by "h/m/s".');
      err(ValidationCore.timeOffset({}, 's', {}, '1-6d'),
        'Time offset param "s" ("1-6d") should be a number suffixed by "h/m/s".');
    });
  });

  describe('#name', () => {
    const spec = { type: 'name' };

    it('warns if not a string', () => {
      const result = ValidationCore.name({}, 's', spec, 1);
      err(result, 'Name param "s" ("1") should be a string.');
    });

    it('warns if does not start with a letter', () => {
      err(
        ValidationCore.name({}, 's', spec, '1bc'),
        'Name param "s" ("1bc") should start with a letter.');
      err(
        ValidationCore.name({}, 's', spec, '.bc'),
        'Name param "s" (".bc") should start with a letter.');
    });

    it('warns if contains invalid characters', () => {
      err(ValidationCore.name({}, 's', {}, 'a%b'),
        'Name param "s" ("a%b") should be alphanumeric with dashes or underscores.');
      err(ValidationCore.name({}, 's', {}, 'a"-b'),
        'Name param "s" ("a"-b") should be alphanumeric with dashes or underscores.');
      err(ValidationCore.name({}, 's', {}, 'b^$(D'),
        'Name param "s" ("b^$(D") should be alphanumeric with dashes or underscores.');
    });
  });

  describe('#media', () => {
    it('permits path', () => {
      ok(ValidationCore.media({}, 's', {}, 'abc.mp3'));
    });

    it('warns if not a string', () => {
      err(ValidationCore.media({}, 's', {}, 123),
        'Media param "s" should be a string.');
      err(ValidationCore.media({}, 's', {}, false),
        'Media param "s" should be a string.');
    });

    it('warns if not valid extension', () => {
      const spec = { extensions: ['mp4', 'jpg'] };
      err(ValidationCore.media({}, 's', spec, 'gabe.mp3'),
        'Media param "s" should have one of the following extensions: mp4, jpg.');
    });

    it('warns if required and blank', () => {
      ok(ValidationCore.media({}, 's', { required: true }, 'val'));
      err(ValidationCore.media({}, 's', { required: true }, ''),
        'Media param "s" should not be blank.');
    });
  });

  describe('#enum', () => {
    it('permits if in enum', () => {
      const spec = { type: 'enum', options: [1, true, 'abc'] };
      ok(ValidationCore.enum({}, 's', spec, 1));
      ok(ValidationCore.enum({}, 's', spec, true));
      ok(ValidationCore.enum({}, 's', spec, 'abc'));
    });

    it('warns if not in enum', () => {
      const spec = { type: 'enum', options: [1, true, 'abc'] };
      err(ValidationCore.enum({}, 's', spec, '1'),
        'Enum param "s" is not one of "1", "true", "abc".');
      err(ValidationCore.enum({}, 's', spec, false),
        'Enum param "s" is not one of "1", "true", "abc".');
      err(ValidationCore.enum({}, 's', spec, 'adc'),
        'Enum param "s" is not one of "1", "true", "abc".');
    });
  });

  describe('#simpleAttribute', () => {
    it('permits valid value names', () => {
      ok(ValidationCore.simpleAttribute({}, 's', {}, 'abc'));
      ok(ValidationCore.simpleAttribute({}, 's', {}, 'A12'));
      ok(ValidationCore.simpleAttribute({}, 's', {}, 'A_BC'));
    });

    it('warns if not a string', () => {
      err(ValidationCore.simpleAttribute({}, 's', {}, 1),
        'Simple attribute param "s" should be a string.');
    });

    it('warns if starts with a number', () => {
      err(ValidationCore.simpleAttribute({}, 's', {}, '0'),
        'Simple attribute param "s" ("0") should start with a letter.');
    });

    it('does not allow quotes', () => {
      err(ValidationCore.simpleAttribute({}, 's', {}, '"abc"'),
        'Simple attribute param "s" (""abc"") should start with a letter.');
      err(ValidationCore.simpleAttribute({}, 's', {}, '\'A\''),
        'Simple attribute param "s" ("\'A\'") should start with a letter.');
    });

    it('warns if contains invalid characters', () => {
      err(ValidationCore.simpleAttribute({}, 's', {}, 'a.b'),
        'Simple attribute param "s" ("a.b") should be alphanumeric with underscores.');
      err(ValidationCore.simpleAttribute({}, 's', {}, 'b^$(D'),
        'Simple attribute param "s" ("b^$(D") should be alphanumeric with underscores.');
    });
  });

  describe('#lookupable', () => {
    it('permits valid value names', () => {
      ok(ValidationCore.lookupable({}, 's', {}, 'abc'));
      ok(ValidationCore.lookupable({}, 's', {}, 'A12'));
      ok(ValidationCore.lookupable({}, 's', {}, 'A_BC'));
      ok(ValidationCore.lookupable({}, 's', {}, 'A-BC'));
      ok(ValidationCore.lookupable({}, 's', {}, 'a.b.c'));
      ok(ValidationCore.lookupable({}, 's', {}, '0'));
    });

    it('permits with quotes', () => {
      ok(ValidationCore.lookupable({}, 's', {}, '"abc"'));
      ok(ValidationCore.lookupable({}, 's', {}, '\'A\''));
    });

    it('warns if not a string', () => {
      err(ValidationCore.lookupable({}, 's', {}, 1),
        'Lookupable param "s" ("1") should be a string.');
    });

    it('warns if contains invalid characters', () => {
      err(ValidationCore.lookupable({}, 's', {}, 'a=b'),
        'Lookupable param "s" ("a=b") should be alphanumeric with underscores, dashes and periods.');
      err(ValidationCore.lookupable({}, 's', {}, 'b^$(D'),
        'Lookupable param "s" ("b^$(D") should be alphanumeric with underscores, dashes and periods.');
    });
  });

  describe('#reference', () => {
    const script = { content: { geofences: [{ name: 'GEOFENCE-2' }] } };
    const spec = { type: 'reference', collection: 'geofences' };

    it('permits found references', () => {
      ok(ValidationCore.reference(script, 's', spec, 'GEOFENCE-2'));
    });

    it('warns if reference is not found', () => {
      err(
        ValidationCore.reference(script, 's', spec, 'GEOFENCE-3'),
        'Reference param "s" ("GEOFENCE-3") is not in collection "geofences".');
    });

    it('warns if collection is empty', () => {
      const spec = { type: 'reference', collection: 'messages' };
      err(
        ValidationCore.reference(script, 's', spec, 'GEOFENCE-3'),
        'Reference param "s" ("GEOFENCE-3") is not in collection "messages".');
    });

    it('warns if not a string', () => {
      const result = ValidationCore.reference({}, 's', spec, 1);
      err(result, 'Reference param "s" ("1") should be a string.');
    });

    it('warns if does not start with a letter', () => {
      err(
        ValidationCore.reference({}, 's', spec, '1bc'),
        'Reference param "s" ("1bc") should start with a letter.');
      err(
        ValidationCore.reference({}, 's', spec, '.bc'),
        'Reference param "s" (".bc") should start with a letter.');
    });

    it('warns if contains invalid characters', () => {
      err(ValidationCore.reference({}, 's', {}, 'a%b'),
        'Reference param "s" ("a%b") should be alphanumeric with dashes or underscores.');
      err(ValidationCore.reference({}, 's', {}, 'a"-b'),
        'Reference param "s" ("a"-b") should be alphanumeric with dashes or underscores.');
      err(ValidationCore.reference({}, 's', {}, 'b^$(D'),
        'Reference param "s" ("b^$(D") should be alphanumeric with dashes or underscores.');
    });

    it('permits "null" only if explicitly allowed', () => {
      const specWithNull = {
        type: 'reference',
        collection: 'geofences',
        allowNull: true
      };
      ok(ValidationCore.reference(script, 's', specWithNull, 'null'));
      err(ValidationCore.reference(script, 's', spec, 'null'),
        'Reference param "s" ("null") is not in collection "geofences".');
    });
  });

  describe('#ifClause', () => {
    const spec = { type: 'ifClause' };

    it('warns if not an object', () => {
      err(ValidationCore.ifClause({}, 's', spec, [1]),
        'If param "s" should be an object.');
      err(ValidationCore.ifClause({}, 's', spec, 123),
        'If param "s" should be an object.');
      err(ValidationCore.ifClause({}, 's', spec, true),
        'If param "s" should be an object.');
    });

    it('validates if statement', () => {
      const script = {};
      const stubResponse = ['response'];
      const param = { op: 'istrue' };
      sandbox.stub(ValidationCore, 'validateParam').returns(stubResponse);

      const resp = ValidationCore.ifClause(script, 's', spec, param);

      assert.strictEqual(resp, stubResponse);
      sinon.assert.calledWith(ValidationCore.validateParam.firstCall,
        script, 's', ConditionCore.ifSpec, param);
    });
  });

  describe('#dictionary', () => {
    const spec = {
      type: 'dictionary',
      keys: { type: 'name' },
      values: { type: 'simpleValue' }
    };

    it('checks keys and values', () => {
      const valid = { abc_123: 5, 'def_egf': true, 'word_two': 'abc' };
      ok(ValidationCore.dictionary({}, 's', spec, valid));
    });

    it('warns if not an object', () => {
      err(ValidationCore.dictionary({}, 's', spec, [1]),
        'Dictionary param "s" should be an object.');
      err(ValidationCore.dictionary({}, 's', spec, 123),
        'Dictionary param "s" should be an object.');
      err(ValidationCore.dictionary({}, 's', spec, true),
        'Dictionary param "s" should be an object.');
    });

    it('warns if invalid key', () => {
      const invalid = { 'd%f': false };
      err(ValidationCore.dictionary({}, 's', spec, invalid),
        'Name param "s[d%f]" ("d%f") should be alphanumeric with dashes or underscores.');
    });

    it('warns if invalid value', () => {
      const invalid = { 'car': ['an', 'array'] };
      err(ValidationCore.dictionary({}, 's', spec, invalid),
        'Simple param "s[car]" should be a string, number or boolean.');
    });
  });

  describe('#list', () => {
    const spec = { type: 'list', items: { type: 'number' } };

    it('checks items', () => {
      const valid = [1, 2, 3, 4];
      ok(ValidationCore.list({}, 's', spec, valid));
    });

    it('warns if not an array', () => {
      err(ValidationCore.list({}, 's', spec, {a: 5}),
        'List param "s" should be an array.');
      err(ValidationCore.list({}, 's', spec, 123),
        'List param "s" should be an array.');
      err(ValidationCore.list({}, 's', spec, true),
        'List param "s" should be an array.');
    });

    it('warns if invalid item', () => {
      const invalid = ['abc'];
      err(ValidationCore.list({}, 's', spec, invalid),
        'Number param "s[0]" should be a number.');
    });
  });

  describe('#object', () => {
    const spec = {
      type: 'object',
      properties: {
        name: { type: 'name', required: true },
        count: { type: 'number' }
      }
    };

    it('checks object', () => {
      const valid = { name: 'test', count: 123 };
      ok(ValidationCore.object({}, 's', spec, valid));
    });

    it('warns if missing item', () => {
      err(ValidationCore.object({}, 's', spec, { count: 2 }),
        'Required param "s.name" not present.');
    });

    it('warns if extra item', () => {
      const withExtra = { name: 'test', extra: true };
      err(ValidationCore.object({}, 's', spec, withExtra),
        'Unexpected param "s.extra" (expected one of: name, count).');
    });

    it('gathers multiple warnings', () => {
      const invalid = { count: [123], extra: true };
      const res = ValidationCore.object({}, 's', spec, invalid);
      eq(res, [
        'Required param "s.name" not present.',
        'Unexpected param "s.extra" (expected one of: name, count).'
      ]);
    });

    it('warns if not an object', () => {
      err(ValidationCore.object({}, 's', spec, 'abc'),
        'Parameters should be an object.');
    });
  });

  describe('#getComponentVariety', () => {
    it('gets variety by key', () => {
      const spec = { key: 'type' };
      const param = { type: 'frog' };
      const res = ValidationCore.getComponentVariety(spec, param);

      assert.strictEqual(res, 'frog');
    });

    it('gets variety by function', () => {
      const spec = { key: obj => obj.type };
      const param = { type: 'frog' };
      const res = ValidationCore.getComponentVariety(spec, param);

      assert.strictEqual(res, 'frog');
    });

    it('returns null for null param', () => {
      const spec = { key: obj => obj.type };
      const res = ValidationCore.getComponentVariety(spec, null);

      assert.strictEqual(res, null);
    });
  });

  describe('#getComponentClass', () => {
    const spec = {
      common: { properties: { type: { type: 'string' } } },
      classes: {
        frog: { properties: { ribbits: { type: 'boolean' } } }
      }
    };

    it('returns merged class by variety', () => {
      const res = ValidationCore.getComponentClass(spec, 'frog');

      assert.deepStrictEqual(res, {
        properties: {
          type: spec.common.properties.type,
          ribbits: spec.classes.frog.properties.ribbits
        }
      });
    });

    it('returns only common class if null variety', () => {
      const res = ValidationCore.getComponentClass(spec, null);

      assert.deepStrictEqual(res, spec.common);
    });

    it('throws error if invalid class', () => {
      assert.throws(() => {
        ValidationCore.getComponentClass(spec, 'parrot');
      });
    });
  });

  describe('#component', () => {
    const spec = {
      type: 'component',
      key: 'family',
      common: {
        properties: {
          family: { type: 'string', required: true },
          name: { type: 'string' }
        }
      },
      classes: {
        snake: {
          properties: {
            isVenomous: { type: 'boolean', required: true }
          }
        },
        fish: {
          properties: {
            numFins: { type: 'number' }
          }
        }
      }
    };

    it('allows members of either class', () => {
      const snake = { family: 'snake', name: 'rattler', isVenomous: true };
      ok(ValidationCore.component({}, 's', spec, snake));

      const fish = { family: 'fish', name: 'zebrafish' };
      ok(ValidationCore.component({}, 's', spec, fish));
    });

    it('warns if missing key', () => {
      const invalid = {};
      err(ValidationCore.component({}, 's', spec, invalid),
        'Required param "s[family]" not present.');
    });

    it('warns if non-string key', () => {
      const invalid = { family: 123 };
      err(ValidationCore.component({}, 's', spec, invalid),
        'Component param "s" property "family" should be a string.');
    });

    it('warns if invalid key', () => {
      const invalid = { family: 'marsupial' };
      err(ValidationCore.component({}, 's', spec, invalid),
        'Component param "s" property "family" ("marsupial") should be one of: snake, fish.');
    });

    it('warns if invalid items in common class', () => {
      const invalid = { family: 'snake', name: false, isVenomous: true };
      err(ValidationCore.component({}, 's', spec, invalid),
        'String param "s.name" should be a string.');
    });

    it('warns if invalid items in varied class', () => {
      const invalid = { family: 'snake', isVenomous: 'abc' };
      err(ValidationCore.component({}, 's', spec, invalid),
        'Boolean param "s.isVenomous" ("abc") should be true or false.');
    });

    it('warns if extra items', () => {
      const invalid = { family: 'snake', isVenomous: false, extra: 'hi' };
      err(ValidationCore.component({}, 's', spec, invalid),
        'Unexpected param "s.extra" (expected one of: family, name, isVenomous).');
    });

    it('warns if has items from non-chosen variety', () => {
      const invalid = { family: 'snake', isVenomous: false, numFins: 3 };
      err(ValidationCore.component({}, 's', spec, invalid),
        'Unexpected param "s.numFins" (expected one of: family, name, isVenomous).');
    });
  });

  describe('#validateParam', () => {
    it('calls param by name', () => {
      sandbox.stub(ValidationCore, 'string').returns([]);
      const spec = { type: 'string' };

      ValidationCore.validateParam({}, 'name', spec, null);

      sinon.assert.calledWith(ValidationCore.string, {}, 'name', spec, null);
    });
  });

  describe('#validateParams', () => {
    it.skip('warns on non-object input', () => {});
    it.skip('warns on unexpected param', () => {});
    it.skip('warns on missing required param', () => {});
    it.skip('passes through if just one key equaling self', () => {});
    it.skip('does not pass through if multiple keys', () => {});
    it.skip('allows non-object input if passthrough', () => {});
  });

  describe('#validateResource', () => {
    it('works when nested', () => {
      const value = {
        name: 'sarai1',
        section: 'contacts',
        title: 'Sarai Medouin',
        panels: [{
          type: 'image',
          style: 'float-right',
          path: '{{Sarai.photo}}'
        }, {
          type: 'text',
          text: 'You are meeting Sarai.'
        }],
        if: 'contact_sarai1'
      };

      const panelCommon = {
        properties: {
          type: { type: 'string', required: true },
          if: { type: 'string' }
        }
      };

      const panelClasses = {
        image: {
          properties: {
            path: { type: 'media', required: true },
            style: { type: 'enum', options: ['float-right'] }
          }
        },
        text: {
          properties: {
            text: { type: 'string', required: true },
            style: { type: 'enum', options: ['centered', 'quest'] }
          }
        },
      };

      const panel = {
        type: 'component',
        key: 'type',
        common: panelCommon,
        classes: panelClasses
      };

      const contentPage = {
        properties: {
          name: { type: 'name', required: true },
          section: { type: 'string', required: true },
          title: { type: 'string', required: true },
          if: { type: 'string' },
          panels: { type: 'list', items: panel }
        }
      };

      ok(ValidationCore.validateResource({}, contentPage, value, ''));
    });
  });
});
