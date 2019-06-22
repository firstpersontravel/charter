const sinon = require('sinon');
const assert = require('assert');

const Validations = require('../../src/utils/validations');
const Validator = require('../../src/utils/validator');

const eq = assert.deepStrictEqual;
const ok = (res) => eq(res === undefined ? [] : res, []);
const err = (res, expected) => eq(res, [expected]);

const fakeRegistry = {
  conditions: {
    fake: {
      eval: () => true
    }
  },
  components: {
    widgets: {
      typeKey: 'model'
    }
  }
};

const animalsRegistry = {
  components: {
    animals: {
      typeKey: 'family',
      propertiesKey: 'properties',
      common: {
        properties: {
          name: { type: 'string' }
        }
      }
    }
  },
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
};

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

  describe('#getComponentVariety', () => {
    it('gets variety by key', () => {
      const spec = { type: 'component', component: 'widgets' };
      const param = { model: 'frog' };
      const res = validator.getComponentVariety(spec, param);

      assert.strictEqual(res, 'frog');
    });

    it('returns null for null param', () => {
      const spec = { type: 'component', component: 'widgets' };
      const res = validator.getComponentVariety(spec, null);

      assert.strictEqual(res, null);
    });
  });

  describe('#getComponentClass', () => {
    const spec = { type: 'components', component: 'animals' };

    it('returns merged class by variety', () => {
      const res = animalsValidator.getComponentClass(spec, 'snake');

      assert.deepStrictEqual(res, {
        properties: {
          family: {
            type: 'enum',
            required: true,
            options: ['snake', 'fish'],
            help: 'Type of animals.',
            display: { label: false }
          },
          name: {
            type: 'string'
          },
          isVenomous: {
            type: 'boolean',
            required: true
          }
        }
      });
    });

    it('returns only common class if null variety', () => {
      const res = animalsValidator.getComponentClass(spec, null);

      assert.deepStrictEqual(res, {
        properties: {
          family: {
            type: 'enum',
            required: true,
            options: ['snake', 'fish'],
            help: 'Type of animals.',
            display: { label: false }
          }
        },
        display: { form: 'inline' }
      });
    });

    it('throws error if invalid class', () => {
      assert.throws(() => {
        animalsValidator.getComponentClass(spec, 'parrot');
      });
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
    it.skip('works when nested', () => {
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