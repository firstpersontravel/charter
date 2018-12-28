const assert = require('assert');

const ParamValidators = require('../../src/utils/param_validators');

const eq = assert.deepStrictEqual;
const ok = (res) => eq(res === undefined ? [] : res, []);
const err = (res, expected) => eq(res, [expected]);

describe('ParamValidators', () => {
  describe('#string', () => {
    it('permits string', () => {
      ok(ParamValidators.string({}, 's', {}, 'abc'));
    });

    it('warns if not a string', () => {
      err(
        ParamValidators.string({}, 's', {}, []),
        'String param "s" should be a string.');
    });
  });

  describe('#simple', () => {
    it('permits string, number, or boolean', () => {
      ok(ParamValidators.simple({}, 's', {}, 'abc'));
      ok(ParamValidators.simple({}, 's', {}, 123));
      ok(ParamValidators.simple({}, 's', {}, true));
      ok(ParamValidators.simple({}, 's', {}, false));
    });

    it('warns if not a string, number or boolean', () => {
      err(ParamValidators.simple({}, 's', {}, [1]),
        'Simple param "s" should be a string, number or boolean.');
      err(ParamValidators.simple({}, 's', {}, {a: 2}),
        'Simple param "s" should be a string, number or boolean.');
    });
  });

  describe('#ifstring', () => {
    it('permits string', () => {
      ok(ParamValidators.ifstring({}, 's', {}, 'abc'));
    });

    it('warns if not a string', () => {
      err(ParamValidators.ifstring({}, 's', {}, []),
        'Ifstring param "s" should be a string.');
    });

    it.skip('validates if statement', () => {});
  });

  describe('#valueName', () => {
    it('permits valid value names', () => {
      ok(ParamValidators.valueName({}, 's', {}, 'abc'));
      ok(ParamValidators.valueName({}, 's', {}, 'A12'));
      ok(ParamValidators.valueName({}, 's', {}, 'A_BC'));
      ok(ParamValidators.valueName({}, 's', {}, 'a.b.c'));
      ok(ParamValidators.valueName({}, 's', {}, '0'));
    });

    it('permits with quotes', () => {
      ok(ParamValidators.valueName({}, 's', {}, '"abc"'));
      ok(ParamValidators.valueName({}, 's', {}, '\'A\''));
    });

    it('warns if not a string', () => {
      err(ParamValidators.valueName({}, 's', {}, 1),
        'Value name param "s" should be a string.');
    });

    it('warns if contains invalid characters', () => {
      err(ParamValidators.valueName({}, 's', {}, 'a-b'),
        'Value name param "s" should be alphanumeric with periods.');
      err(ParamValidators.valueName({}, 's', {}, 'a"-b'),
        'Value name param "s" should be alphanumeric with periods.');
      err(ParamValidators.valueName({}, 's', {}, 'b^$(D'),
        'Value name param "s" should be alphanumeric with periods.');
    });
  });

  describe('#number', () => {
    it('permits string number', () => {
      ok(ParamValidators.number({}, 's', {}, '1'));
    });

    it('permits number', () => {
      ok(ParamValidators.number({}, 's', {}, 1.5));
    });

    it('warns if not a number', () => {
      err(ParamValidators.number({}, 's', {}, 'abc'),
        'Number param "s" should be a number.');
    });
  });

  describe('#enum', () => {
    it('permits if in enum', () => {
      const spec = { type: 'enum', values: [1, true, 'abc'] };
      ok(ParamValidators.enum({}, 's', spec, 1));
      ok(ParamValidators.enum({}, 's', spec, true));
      ok(ParamValidators.enum({}, 's', spec, 'abc'));
    });

    it('warns if not in enum', () => {
      const spec = { type: 'enum', values: [1, true, 'abc'] };
      err(ParamValidators.enum({}, 's', spec, '1'),
        'Enum param "s" is not one of "1", "true", "abc".');
      err(ParamValidators.enum({}, 's', spec, false),
        'Enum param "s" is not one of "1", "true", "abc".');
      err(ParamValidators.enum({}, 's', spec, 'adc'),
        'Enum param "s" is not one of "1", "true", "abc".');
    });
  });

  describe('#reference', () => {
    const script = { content: { geofences: [{ name: 'GEOFENCE-2' }] } };
    const spec = { type: 'reference', collection: 'geofences' };

    it('permits found references', () => {
      ok(ParamValidators.reference(script, 's', spec, 'GEOFENCE-2'));
    });

    it('warns if reference is not found', () => {
      err(
        ParamValidators.reference(script, 's', spec, 'GEOFENCE-3'),
        'Reference param "s" ("GEOFENCE-3") is not in collection "geofences".');
    });

    it('warns if collection is empty', () => {
      const spec = { type: 'reference', collection: 'messages' };
      err(
        ParamValidators.reference(script, 's', spec, 'GEOFENCE-3'),
        'Reference param "s" ("GEOFENCE-3") is not in collection "messages".');
    });

    it('warns if not a string', () => {
      const result = ParamValidators.reference({}, 's', spec, 1);
      err(result, 'Reference param "s" ("1") should be a string.');
    });

    it('warns if does not start with a letter', () => {
      err(
        ParamValidators.reference({}, 's', spec, '1bc'),
        'Reference param "s" ("1bc") should start with a letter.');
      err(
        ParamValidators.reference({}, 's', spec, '.bc'),
        'Reference param "s" (".bc") should start with a letter.');
    });

    it('warns if contains invalid characters', () => {
      err(ParamValidators.reference({}, 's', {}, 'a%b'),
        'Reference param "s" ("a%b") should be alphanumeric with dashes or underscores.');
      err(ParamValidators.reference({}, 's', {}, 'a"-b'),
        'Reference param "s" ("a"-b") should be alphanumeric with dashes or underscores.');
      err(ParamValidators.reference({}, 's', {}, 'b^$(D'),
        'Reference param "s" ("b^$(D") should be alphanumeric with dashes or underscores.');
    });
  });

  describe('#name', () => {
    const spec = { type: 'name' };

    it('warns if not a string', () => {
      const result = ParamValidators.name({}, 's', spec, 1);
      err(result, 'Name param "s" ("1") should be a string.');
    });

    it('warns if does not start with a letter', () => {
      err(
        ParamValidators.name({}, 's', spec, '1bc'),
        'Name param "s" ("1bc") should start with a letter.');
      err(
        ParamValidators.name({}, 's', spec, '.bc'),
        'Name param "s" (".bc") should start with a letter.');
    });

    it('warns if contains invalid characters', () => {
      err(ParamValidators.name({}, 's', {}, 'a%b'),
        'Name param "s" ("a%b") should be alphanumeric with dashes or underscores.');
      err(ParamValidators.name({}, 's', {}, 'a"-b'),
        'Name param "s" ("a"-b") should be alphanumeric with dashes or underscores.');
      err(ParamValidators.name({}, 's', {}, 'b^$(D'),
        'Name param "s" ("b^$(D") should be alphanumeric with dashes or underscores.');
    });
  });

  describe('#media', () => {
    it('permits path', () => {
      ok(ParamValidators.media({}, 's', {}, 'abc.mp3'));
    });

    it('warns if not a string', () => {
      err(ParamValidators.media({}, 's', {}, 123),
        'Media param "s" should be a string.');
      err(ParamValidators.media({}, 's', {}, false),
        'Media param "s" should be a string.');
    });

    it('warns if not valid extension', () => {
      const spec = { extensions: ['mp4', 'jpg'] };
      err(
        ParamValidators.media({}, 's', spec, 'gabe.mp3'),
        'Media param "s" should have one of the following extensions: mp4, jpg.');
    });
  });

  describe('#dictionary', () => {
    const spec = {
      type: 'dictionary',
      keys: { type: 'valueName' },
      values: { type: 'simple' }
    };

    it('checks keys and values', () => {
      const valid = { abc_123: 5, 'def.egf': true, '0': 'abc' };
      ok(ParamValidators.dictionary({}, 's', spec, valid));
    });

    it('warns if not an object', () => {
      err(ParamValidators.dictionary({}, 's', spec, [1]),
        'Dictionary param "s" should be an object.');
      err(ParamValidators.dictionary({}, 's', spec, 123),
        'Dictionary param "s" should be an object.');
      err(ParamValidators.dictionary({}, 's', spec, true),
        'Dictionary param "s" should be an object.');
    });

    it('warns if invalid key', () => {
      const invalid = { 'd%f': false };
      err(ParamValidators.dictionary({}, 's', spec, invalid),
        'Value name param "s key" should be alphanumeric with periods.');
    });

    it('warns if invalid value', () => {
      const invalid = { 'car': ['an', 'array'] };
      err(ParamValidators.dictionary({}, 's', spec, invalid),
        'Simple param "s value" should be a string, number or boolean.');
    });
  });

  describe('#list', () => {
    const spec = { type: 'list', items: { type: 'number' } };

    it('checks items', () => {
      const valid = [1, 2, 3, 4];
      ok(ParamValidators.list({}, 's', spec, valid));
    });

    it('warns if not an array', () => {
      err(ParamValidators.list({}, 's', spec, {a: 5}),
        'List param "s" should be an array.');
      err(ParamValidators.list({}, 's', spec, 123),
        'List param "s" should be an array.');
      err(ParamValidators.list({}, 's', spec, true),
        'List param "s" should be an array.');
    });

    it('warns if invalid item', () => {
      const invalid = ['abc'];
      err(ParamValidators.list({}, 's', spec, invalid),
        'Number param "s item" should be a number.');
    });
  });

  describe('#subresource', () => {
    const spec = {
      type: 'subresource',
      class: {
        properties: {
          name: { type: 'name', required: true },
          count: { type: 'number' }
        }
      }
    };

    it('checks subresource', () => {
      const valid = { name: 'test', count: 123 };
      ok(ParamValidators.subresource({}, 's', spec, valid));
    });

    it('warns if missing item', () => {
      err(ParamValidators.subresource({}, 's', spec, { count: 2 }),
        'Required param "s.name" not present.');
    });

    it('warns if extra item', () => {
      var withExtra = { name: 'test', extra: true };
      err(ParamValidators.subresource({}, 's', spec, withExtra),
        'Unexpected param "s.extra".');
    });

    it('gathers multiple warnings', () => {
      var invalid = { count: [123], extra: true };
      var res = ParamValidators.subresource({}, 's', spec, invalid);
      eq(res, [
        'Required param "s.name" not present.',
        'Unexpected param "s.extra".'
      ]);
    });

    it('warns if not an object', () => {
      err(ParamValidators.subresource({}, 's', spec, 'abc'),
        'Resource should be an object.');
    });
  });
});
