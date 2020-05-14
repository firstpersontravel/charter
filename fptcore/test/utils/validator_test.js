const sinon = require('sinon');
const assert = require('assert');

const Registry = require('../../src/registry/registry');
const refValidator = require('../../src/utils/validations');
const Validator = require('../../src/utils/validator');

const eq = assert.deepStrictEqual;
const ok = (res) => eq(res === undefined ? [] : res, []);
const err = (res, expected) => eq(res, [expected]);

const fakeModules = [{ conditions: { fake: { eval: () => true } } }];
const fakeComponents = { widgets: { typeKey: 'model' } };
const fakeRegistry = new Registry(fakeModules, fakeComponents);

const animalsModule = {
  resources: {
    zoo: {
      animals: {
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
    }
  }
};
const animalsComponents = {
  animals: {
    typeKey: 'family',
    propertiesKey: 'properties',
    common: {
      properties: {
        name: { type: 'string' }
      }
    }
  }
};
const animalsRegistry = new Registry([animalsModule], animalsComponents);

const sandbox = sinon.sandbox.create();
const validator = new Validator(fakeRegistry);
const animalsValidator = new Validator(animalsRegistry);

describe('Validator', () => {
  beforeEach(() => {
    sandbox.restore();
  });

  describe('#dictionary', () => {
    const spec = {
      type: 'dictionary',
      keys: { type: 'name' },
      values: { type: 'simpleValue' }
    };

    it('checks keys and values', () => {
      const valid = { abc_123: 5, 'def_egf': true, 'word_two': 'abc' };
      ok(validator.dictionary({}, 's', spec, valid));
    });

    it('warns if not an object', () => {
      err(validator.dictionary({}, 's', spec, [1]),
        'Dictionary param "s" should be an object.');
      err(validator.dictionary({}, 's', spec, 123),
        'Dictionary param "s" should be an object.');
      err(validator.dictionary({}, 's', spec, true),
        'Dictionary param "s" should be an object.');
    });

    it('warns if invalid key', () => {
      const invalid = { 'd%f': false };
      err(validator.dictionary({}, 's', spec, invalid),
        'Name param "s[d%f]" ("d%f") should be alphanumeric with dashes or underscores.');
    });

    it('warns if invalid value', () => {
      const invalid = { 'car': ['an', 'array'] };
      err(validator.dictionary({}, 's', spec, invalid),
        'Simple param "s[car]" should be a string, number or boolean.');
    });
  });

  describe('#list', () => {
    const spec = { type: 'list', items: { type: 'number' } };

    it('checks items', () => {
      const valid = [1, 2, 3, 4];
      ok(validator.list({}, 's', spec, valid));
    });

    it('warns if not an array', () => {
      err(validator.list({}, 's', spec, {a: 5}),
        'List param "s" should be an array.');
      err(validator.list({}, 's', spec, 123),
        'List param "s" should be an array.');
      err(validator.list({}, 's', spec, true),
        'List param "s" should be an array.');
    });

    it('warns if invalid item', () => {
      const invalid = ['abc'];
      err(validator.list({}, 's', spec, invalid),
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
      ok(validator.object({}, 's', spec, valid));
    });

    it('warns if missing item', () => {
      err(validator.object({}, 's', spec, { count: 2 }),
        'Required param "s.name" not present.');
    });

    it('warns if extra item', () => {
      const withExtra = { name: 'test', extra: true };
      err(validator.object({}, 's', spec, withExtra),
        'Unexpected param "s.extra" (expected one of: name, count).');
    });

    it('gathers multiple warnings', () => {
      const invalid = { count: [123], extra: true };
      const res = validator.object({}, 's', spec, invalid);
      eq(res, [
        'Required param "s.name" not present.',
        'Unexpected param "s.extra" (expected one of: name, count).'
      ]);
    });

    it('warns if not an object', () => {
      err(validator.object({}, 's', spec, 'abc'),
        'Parameters should be an object.');
    });
  });

  describe('#component', () => {
    const spec = { type: 'components', component: 'animals' };

    it('allows members of either class', () => {
      const snake = { family: 'snake', name: 'rattler', isVenomous: true };
      ok(animalsValidator.component({}, 's', spec, snake));

      const fish = { family: 'fish', name: 'zebrafish' };
      ok(animalsValidator.component({}, 's', spec, fish));
    });

    it('warns if missing key', () => {
      const invalid = {};
      err(animalsValidator.component({}, 's', spec, invalid),
        'Required param "s[family]" not present.');
    });

    it('warns if non-string key', () => {
      const invalid = { family: 123 };
      err(animalsValidator.component({}, 's', spec, invalid),
        '"123" is not one of the "animals" components.');
    });

    it('warns if invalid key', () => {
      const invalid = { family: 'marsupial' };
      err(animalsValidator.component({}, 's', spec, invalid),
        '"marsupial" is not one of the "animals" components.');
    });

    it('warns if invalid items in common class', () => {
      const invalid = { family: 'snake', name: false, isVenomous: true };
      err(animalsValidator.component({}, 's', spec, invalid),
        'String param "s.name" should be a string.');
    });

    it('warns if invalid items in varied class', () => {
      const invalid = { family: 'snake', isVenomous: 'abc' };
      err(animalsValidator.component({}, 's', spec, invalid),
        'Boolean param "s.isVenomous" ("abc") should be true or false.');
    });

    it('warns if extra items', () => {
      const invalid = { family: 'snake', isVenomous: false, extra: 'hi' };
      err(animalsValidator.component({}, 's', spec, invalid),
        'Unexpected param "s.extra" (expected one of: family, name, isVenomous).');
    });

    it('warns if has items from non-chosen variety', () => {
      const invalid = { family: 'snake', isVenomous: false, numFins: 3 };
      err(animalsValidator.component({}, 's', spec, invalid),
        'Unexpected param "s.numFins" (expected one of: family, name, isVenomous).');
    });
  });

  describe('#validateParam', () => {
    it('calls param by name', () => {
      refValidator.string = {
        validate: sandbox.stub().returns([])
      };
      const spec = { type: 'string' };

      validator.validateParam({}, 'name', spec, null);

      sinon.assert.calledWith(refValidator.string.validate, {}, 'name',
        spec, null);
    });

    it('warns on invalid param type', () => {
      const spec = { type: 'invalid' };
      assert.throws(() => {
        validator.validateParam({}, 'name', spec, null);
      }, err => err.message === 'Invalid param type "invalid".');
    });
  });

  describe('#validateParams', () => {
    it('warns on non-object input', () => {
      const invalid = 'abc';
      const paramsSpec = { field: { type: 'string' } };
      err(validator.validateParams({}, paramsSpec, invalid, ''),
        'Parameters should be an object.');
    });

    it('warns on unexpected param', () => {
      const params = { field2: 'abc' };
      const paramsSpec = { field: { type: 'string' } };
      err(validator.validateParams({}, paramsSpec, params, ''),
        'Unexpected param "field2" (expected one of: field).');
    });

    it('warns on missing required param', () => {
      const params = {};
      const paramsSpec = { field: { type: 'string', required: true } };
      err(validator.validateParams({}, paramsSpec, params, ''),
        'Required param "field" not present.');
    });
  });

  describe('#validateResource', () => {
    const panelModule = {
      resources: {
        page: {
          panels: {
            image: {
              properties: {
                path: { type: 'media', required: true },
                style: { type: 'enum', options: ['float-right'] }
              }
            },
            text: {
              properties: {
                text: { type: 'string', required: true },
                style: { type: 'enum', options: ['centered', 'banner'] }
              }
            }
          }
        }
      }
    };
    const panelComponents = {
      panels: {
        typeKey: 'type',
        propertiesKey: 'properties',
        common: {
          properties: {
            type: { type: 'string', required: true },
            if: { type: 'string' }
          }
        }
      }
    };
    const panelsRegistry = new Registry([panelModule], panelComponents);
    const panelsValidator = new Validator(panelsRegistry);

    it('validates nested components', () => {
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

      const contentPage = {
        properties: {
          name: { type: 'name', required: true },
          section: { type: 'string', required: true },
          title: { type: 'string', required: true },
          if: { type: 'string' },
          panels: {
            type: 'list',
            items: { type: 'component', component: 'panels' }
          }
        }
      };

      ok(panelsValidator.validateResource({}, contentPage, value, ''));
    });
  });

  describe('#reference', () => {
    const scriptContent = { geofences: [{ name: 'GEOFENCE-2' }] };
    const spec = { type: 'reference', collection: 'geofences' };
    const refValidator = new Validator({});

    it('permits found references', () => {
      ok(refValidator.reference(scriptContent, 's', spec, 'GEOFENCE-2'));
    });

    it('warns if reference is not found', () => {
      err(
        refValidator.reference(scriptContent, 's', spec, 'GEOFENCE-3'),
        'Reference param "s" ("GEOFENCE-3") is not in collection "geofences".');
    });

    it('warns if collection is empty', () => {
      const spec = { type: 'reference', collection: 'messages' };
      err(
        refValidator.reference(scriptContent, 's', spec, 'GEOFENCE-3'),
        'Reference param "s" ("GEOFENCE-3") is not in collection "messages".');
    });

    it('warns if not a string', () => {
      const result = refValidator.reference({}, 's', spec, 1);
      err(result, 'Reference param "s" ("1") should be a string.');
    });

    it('warns if does not start with a letter', () => {
      err(
        refValidator.reference({}, 's', spec, '1bc'),
        'Reference param "s" ("1bc") should start with a letter.');
      err(
        refValidator.reference({}, 's', spec, '.bc'),
        'Reference param "s" (".bc") should start with a letter.');
    });

    it('warns if contains invalid characters', () => {
      err(refValidator.reference({}, 's', {}, 'a%b'),
        'Reference param "s" ("a%b") should be alphanumeric with dashes or underscores.');
      err(refValidator.reference({}, 's', {}, 'a"-b'),
        'Reference param "s" ("a"-b") should be alphanumeric with dashes or underscores.');
      err(refValidator.reference({}, 's', {}, 'b^$(D'),
        'Reference param "s" ("b^$(D") should be alphanumeric with dashes or underscores.');
    });

    it('permits "null" only if explicitly allowed', () => {
      const specWithNull = {
        type: 'reference',
        collection: 'geofences',
        specialValues: [{ value: 'null', label: 'None' }]
      };
      ok(refValidator.reference(scriptContent, 's', specWithNull, 'null'));
      err(refValidator.reference(scriptContent, 's', spec, 'null'),
        'Reference param "s" ("null") is not in collection "geofences".');
    });
  });
});
