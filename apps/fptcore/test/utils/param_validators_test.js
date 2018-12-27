const assert = require('assert');
const sinon = require('sinon');

const ParamValidators = require('../../src/utils/param_validators');

const sandbox = sinon.sandbox.create();

describe('ParamValidators', () => {

  afterEach(() => {
    sandbox.restore();
  });

  describe('#string', () => {
    it('permits string', () => {
      const result = ParamValidators.string({}, 's', {}, 'abc');
      assert.strictEqual(result, null);
    });

    it('warns if not a string', () => {
      const result = ParamValidators.string({}, 's', {}, []);
      assert.strictEqual(result, 'String param "s" should be a string.');
    });
  });

  describe('#ref', () => {
    it('permits valid refs', () => {
      assert.strictEqual(ParamValidators.ref({}, 's', {}, 'abc'), null);
      assert.strictEqual(ParamValidators.ref({}, 's', {}, 'A12'), null);
      assert.strictEqual(ParamValidators.ref({}, 's', {}, 'A_BC'), null);
      assert.strictEqual(ParamValidators.ref({}, 's', {}, 'a.b.c'), null);
      assert.strictEqual(ParamValidators.ref({}, 's', {}, '0'), null);
    });

    it('permits with quotes', () => {
      assert.strictEqual(ParamValidators.ref({}, 's', {}, '"abc"'), null);
      assert.strictEqual(ParamValidators.ref({}, 's', {}, '\'A\''), null);
    });

    it('warns if not a string', () => {
      const result = ParamValidators.ref({}, 's', {}, 1);
      assert.strictEqual(result, 'Ref param "s" should be a string.');
    });

    it('warns if contains invalid characters', () => {
      assert.strictEqual(ParamValidators.ref({}, 's', {}, 'a-b'),
        'Ref param "s" should be alphanumeric with periods.');
      assert.strictEqual(ParamValidators.ref({}, 's', {}, 'a"-b'),
        'Ref param "s" should be alphanumeric with periods.');
      assert.strictEqual(ParamValidators.ref({}, 's', {}, 'b^$(D'),
        'Ref param "s" should be alphanumeric with periods.');
    });
  });

  describe('#cue_name', () => {
    it('permits valid cue names', () => {
      assert.strictEqual(ParamValidators.cue_name({}, 's', {}, 'abc'), null);
      assert.strictEqual(ParamValidators.cue_name({}, 's', {}, 'A12'), null);
      assert.strictEqual(ParamValidators.cue_name({}, 's', {}, 'A_-'), null);
    });

    it('warns if not a string', () => {
      const result = ParamValidators.cue_name({}, 's', {}, 1);
      assert.strictEqual(result, 'Cue param "s" should be a string.');
    });

    it('warns if does not start with a letter', () => {
      assert.strictEqual(ParamValidators.cue_name({}, 's', {}, '1bc'),
        'Cue param "s" must start with a letter.');
      assert.strictEqual(ParamValidators.cue_name({}, 's', {}, '.bc'),
        'Cue param "s" must start with a letter.');
    });

    it('warns if contains invalid characters', () => {
      assert.strictEqual(ParamValidators.cue_name({}, 's', {}, 'a.b'),
        'Cue param "s" should be alphanumeric with dashes.');
      assert.strictEqual(ParamValidators.cue_name({}, 's', {}, 'b^$(D'),
        'Cue param "s" should be alphanumeric with dashes.');
    });
  });

  describe('#number', () => {
    it('permits string number', () => {
      assert.strictEqual(ParamValidators.number({}, 's', {}, '1'), null);
    });

    it('permits number', () => {
      assert.strictEqual(ParamValidators.number({}, 's', {}, 1.5), null);
    });

    it('warns if not a number', () => {
      assert.strictEqual(ParamValidators.number({}, 's', {}, 'abc'),
        'Number param "s" should be a number.');
    });
  });

  describe('#enum', () => {
    it('permits if in enum', () => {
      const spec = { type: 'enum', values: [1, true, 'abc'] };
      assert.strictEqual(ParamValidators.enum({}, 's', spec, 1), null);
      assert.strictEqual(ParamValidators.enum({}, 's', spec, true), null);
      assert.strictEqual(ParamValidators.enum({}, 's', spec, 'abc'), null);
    });

    it('warns if not in enum', () => {
      const spec = { type: 'enum', values: [1, true, 'abc'] };
      assert.strictEqual(ParamValidators.enum({}, 's', spec, '1'),
        'Enum param "s" is not one of "1", "true", "abc".');
      assert.strictEqual(ParamValidators.enum({}, 's', spec, false),
        'Enum param "s" is not one of "1", "true", "abc".');
      assert.strictEqual(ParamValidators.enum({}, 's', spec, 'adc'),
        'Enum param "s" is not one of "1", "true", "abc".');
    });
  });

  describe('#resource', () => {
    const script = { content: { geofences: [{ name: 'GEOFENCE-2' }] } };
    const spec = { type: 'resource', collection: 'geofences' };

    it('permits found resources', () => {
      assert.strictEqual(
        ParamValidators.resource(script, 's', spec, 'GEOFENCE-2'), null);
    });

    it('warns if resource is not found', () => {
      assert.strictEqual(
        ParamValidators.resource(script, 's', spec, 'GEOFENCE-3'),
        'Resource param "s" ("GEOFENCE-3") is not in collection "geofences".');
    });

    it('warns if collection is empty', () => {
      const spec = { type: 'resource', collection: 'messages' };
      assert.strictEqual(
        ParamValidators.resource(script, 's', spec, 'GEOFENCE-3'),
        'Resource param "s" ("GEOFENCE-3") is not in collection "messages".');
    });

    it('warns if not a string', () => {
      const result = ParamValidators.resource({}, 's', spec, 1);
      assert.strictEqual(result, 'Resource param "s" should be a string.');
    });

    it('warns if does not start with a letter', () => {
      assert.strictEqual(
        ParamValidators.resource({}, 's', spec, '1bc'),
        'Resource param "s" must start with a letter.');
      assert.strictEqual(
        ParamValidators.resource({}, 's', spec, '.bc'),
        'Resource param "s" must start with a letter.');
    });
  });
});
