const sinon = require('sinon');
const assert = require('assert');

const ConditionCore = require('../../src/cores/condition');
const Validations = require('../../src/utils/validations');
const Validator = require('../../src/utils/validator');

const eq = assert.deepStrictEqual;
const ok = (res) => eq(res === undefined ? [] : res, []);
const err = (res, expected) => eq(res, [expected]);

const sandbox = sinon.sandbox.create();
const validator = new Validator();

describe('Validator', () => {
  beforeEach(() => {
    sandbox.restore();
  });

  describe('#ifClause', () => {
    const spec = { type: 'ifClause' };

    it('warns if not an object', () => {
      err(validator.ifClause({}, 's', spec, [1]),
        'If param "s" should be an object.');
      err(validator.ifClause({}, 's', spec, 123),
        'If param "s" should be an object.');
      err(validator.ifClause({}, 's', spec, true),
        'If param "s" should be an object.');
    });

    it('validates if statement', () => {
      const script = {};
      const stubResponse = ['response'];
      const param = { op: 'istrue' };
      sandbox.stub(validator, 'validateParam').returns(stubResponse);

      const resp = validator.ifClause(script, 's', spec, param);

      assert.strictEqual(resp, stubResponse);
      sinon.assert.calledWith(validator.validateParam.firstCall,
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

  describe('#getComponentVariety', () => {
    it('gets variety by key', () => {
      const spec = { key: 'type' };
      const param = { type: 'frog' };
      const res = validator.getComponentVariety(spec, param);

      assert.strictEqual(res, 'frog');
    });

    it('gets variety by function', () => {
      const spec = { key: obj => obj.type };
      const param = { type: 'frog' };
      const res = validator.getComponentVariety(spec, param);

      assert.strictEqual(res, 'frog');
    });

    it('returns null for null param', () => {
      const spec = { key: obj => obj.type };
      const res = validator.getComponentVariety(spec, null);

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
      const res = validator.getComponentClass(spec, 'frog');

      assert.deepStrictEqual(res, {
        properties: {
          type: spec.common.properties.type,
          ribbits: spec.classes.frog.properties.ribbits
        }
      });
    });

    it('returns only common class if null variety', () => {
      const res = validator.getComponentClass(spec, null);

      assert.deepStrictEqual(res, spec.common);
    });

    it('throws error if invalid class', () => {
      assert.throws(() => {
        validator.getComponentClass(spec, 'parrot');
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
      ok(validator.component({}, 's', spec, snake));

      const fish = { family: 'fish', name: 'zebrafish' };
      ok(validator.component({}, 's', spec, fish));
    });

    it('warns if missing key', () => {
      const invalid = {};
      err(validator.component({}, 's', spec, invalid),
        'Required param "s[family]" not present.');
    });

    it('warns if non-string key', () => {
      const invalid = { family: 123 };
      err(validator.component({}, 's', spec, invalid),
        'Component param "s" property "family" should be a string.');
    });

    it('warns if invalid key', () => {
      const invalid = { family: 'marsupial' };
      err(validator.component({}, 's', spec, invalid),
        'Component param "s" property "family" ("marsupial") should be one of: snake, fish.');
    });

    it('warns if invalid items in common class', () => {
      const invalid = { family: 'snake', name: false, isVenomous: true };
      err(validator.component({}, 's', spec, invalid),
        'String param "s.name" should be a string.');
    });

    it('warns if invalid items in varied class', () => {
      const invalid = { family: 'snake', isVenomous: 'abc' };
      err(validator.component({}, 's', spec, invalid),
        'Boolean param "s.isVenomous" ("abc") should be true or false.');
    });

    it('warns if extra items', () => {
      const invalid = { family: 'snake', isVenomous: false, extra: 'hi' };
      err(validator.component({}, 's', spec, invalid),
        'Unexpected param "s.extra" (expected one of: family, name, isVenomous).');
    });

    it('warns if has items from non-chosen variety', () => {
      const invalid = { family: 'snake', isVenomous: false, numFins: 3 };
      err(validator.component({}, 's', spec, invalid),
        'Unexpected param "s.numFins" (expected one of: family, name, isVenomous).');
    });
  });

  describe('#validateParam', () => {
    it('calls param by name', () => {
      sandbox.stub(Validations, 'string').returns([]);
      const spec = { type: 'string' };

      validator.validateParam({}, 'name', spec, null);

      sinon.assert.calledWith(Validations.string, {}, 'name', spec, null);
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

      ok(validator.validateResource({}, contentPage, value, ''));
    });
  });
});
