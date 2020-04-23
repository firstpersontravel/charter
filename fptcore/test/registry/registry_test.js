const assert = require('assert');

const Registry = require('../../src/registry/registry');

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

describe('Registry', () => {
  describe('#getComponentVariety', () => {
    it('gets variety by key', () => {
      const spec = { type: 'component', component: 'widgets' };
      const param = { model: 'frog' };
      const res = fakeRegistry.getComponentVariety(spec, param);

      assert.strictEqual(res, 'frog');
    });

    it('returns null for null param', () => {
      const spec = { type: 'component', component: 'widgets' };
      const res = fakeRegistry.getComponentVariety(spec, null);

      assert.strictEqual(res, null);
    });
  });

  describe('#getComponentClass', () => {
    const spec = { type: 'components', component: 'animals' };

    it('returns merged class by variety', () => {
      const res = animalsRegistry.getComponentClass(spec, 'snake');

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
      const res = animalsRegistry.getComponentClass(spec, null);

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
        animalsRegistry.getComponentClass(spec, 'parrot');
      });
    });
  });

});
