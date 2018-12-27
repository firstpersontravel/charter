const assert = require('assert');

const ParamValidators = require('../../src/utils/param_validators');

const eq = assert.deepStrictEqual;
const ok = (res) => eq(res, []);
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

  describe('#ref', () => {
    it('permits valid refs', () => {
      ok(ParamValidators.ref({}, 's', {}, 'abc'));
      ok(ParamValidators.ref({}, 's', {}, 'A12'));
      ok(ParamValidators.ref({}, 's', {}, 'A_BC'));
      ok(ParamValidators.ref({}, 's', {}, 'a.b.c'));
      ok(ParamValidators.ref({}, 's', {}, '0'));
    });

    it('permits with quotes', () => {
      ok(ParamValidators.ref({}, 's', {}, '"abc"'));
      ok(ParamValidators.ref({}, 's', {}, '\'A\''));
    });

    it('warns if not a string', () => {
      err(ParamValidators.ref({}, 's', {}, 1),
        'Ref param "s" should be a string.');
    });

    it('warns if contains invalid characters', () => {
      err(ParamValidators.ref({}, 's', {}, 'a-b'),
        'Ref param "s" should be alphanumeric with periods.');
      err(ParamValidators.ref({}, 's', {}, 'a"-b'),
        'Ref param "s" should be alphanumeric with periods.');
      err(ParamValidators.ref({}, 's', {}, 'b^$(D'),
        'Ref param "s" should be alphanumeric with periods.');
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

  describe('#resource', () => {
    const script = { content: { geofences: [{ name: 'GEOFENCE-2' }] } };
    const spec = { type: 'resource', collection: 'geofences' };

    it('permits found resources', () => {
      ok(ParamValidators.resource(script, 's', spec, 'GEOFENCE-2'));
    });

    it('warns if resource is not found', () => {
      err(
        ParamValidators.resource(script, 's', spec, 'GEOFENCE-3'),
        'Resource param "s" ("GEOFENCE-3") is not in collection "geofences".');
    });

    it('warns if collection is empty', () => {
      const spec = { type: 'resource', collection: 'messages' };
      err(
        ParamValidators.resource(script, 's', spec, 'GEOFENCE-3'),
        'Resource param "s" ("GEOFENCE-3") is not in collection "messages".');
    });

    it('warns if not a string', () => {
      const result = ParamValidators.resource({}, 's', spec, 1);
      err(result, 'Resource param "s" ("1") should be a string.');
    });

    it('warns if does not start with a letter', () => {
      err(
        ParamValidators.resource({}, 's', spec, '1bc'),
        'Resource param "s" ("1bc") should start with a letter.');
      err(
        ParamValidators.resource({}, 's', spec, '.bc'),
        'Resource param "s" (".bc") should start with a letter.');
    });

    it('warns if contains invalid characters', () => {
      err(ParamValidators.resource({}, 's', {}, 'a%b'),
        'Resource param "s" ("a%b") should be alphanumeric with dashes or underscores.');
      err(ParamValidators.resource({}, 's', {}, 'a"-b'),
        'Resource param "s" ("a"-b") should be alphanumeric with dashes or underscores.');
      err(ParamValidators.resource({}, 's', {}, 'b^$(D'),
        'Resource param "s" ("b^$(D") should be alphanumeric with dashes or underscores.');
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

  describe('#dictionary', () => {
    const spec = {
      type: 'dictionary',
      keys: { type: 'ref' },
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
        'Ref param "s key" should be alphanumeric with periods.');
    });

    it('warns if invalid value', () => {
      const invalid = { 'car': ['an', 'array'] };
      err(ParamValidators.dictionary({}, 's', spec, invalid),
        'Simple param "s value" should be a string, number or boolean.');
    });
  });
});
