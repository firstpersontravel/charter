const sinon = require('sinon');
const assert = require('assert');

const Validations = require('../../src/utils/validations');

const eq = assert.deepStrictEqual;
const ok = (res) => eq(res === undefined ? [] : res, []);
const err = (res, expected) => eq(res, [expected]);

const sandbox = sinon.sandbox.create();

describe('Validations', () => {
  beforeEach(() => {
    sandbox.restore();
  });

  describe('#string', () => {
    it('permits string', () => {
      ok(Validations.string({}, 's', {}, 'abc'));
    });

    it('warns if not a string', () => {
      err(Validations.string({}, 's', {}, []),
        'String param "s" should be a string.');
    });

    it('warns if required and blank', () => {
      ok(Validations.string({}, 's', { required: true }, 'val'));
      err(Validations.string({}, 's', { required: true }, ''),
        'String param "s" should not be blank.');
    });
  });

  describe('#markdown', () => {
    it('permits string', () => {
      ok(Validations.markdown({}, 's', {}, 'abc'));
    });

    it('warns if not a string', () => {
      err(Validations.markdown({}, 's', {}, []),
        'Markdown param "s" should be a string.');
    });

    it('warns if required and blank', () => {
      ok(Validations.markdown({}, 's', { required: true }, 'val'));
      err(Validations.markdown({}, 's', { required: true }, ''),
        'Markdown param "s" should not be blank.');
    });
  });

  describe('#email', () => {
    it('permits email', () => {
      ok(Validations.email({}, 's', {}, 'dispatch@tacosyndicate.family'));
      ok(Validations.email({}, 's', {}, '<test@test.com>'));
    });

    it('permits email and name', () => {
      ok(Validations.email({}, 's', {}, '"Taco Syndicate Dispatch" <dispatch@tacosyndicate.family>'));
      ok(Validations.email({}, 's', {}, 'Taco Syndicate Dispatch <dispatch@tacosyndicate.family>'));
      ok(Validations.email({}, 's', {}, '"Gabe\'s Mom" <a-b-c@d_eF.net>'));
    });


    it('warns if not a string', () => {
      err(Validations.email({}, 's', {}, []),
        'Email param "s" should be a string.');
    });

    it('warns if required and blank', () => {
      ok(Validations.email({}, 's', { required: true }, 'val@val.com'));
      err(Validations.email({}, 's', { required: true }, ''),
        'Email param "s" should not be blank.');
    });

    it('warns if not a valid email', () => {
      err(Validations.email({}, 's', {}, 'asdjsadk'),
        'Email param "s" should be a valid email.');
      err(Validations.email({}, 's', {}, 'abc.com'),
        'Email param "s" should be a valid email.');
      err(Validations.email({}, 's', {}, 'john@domain'),
        'Email param "s" should be a valid email.');
      err(Validations.email({}, 's', {}, '"john@domain"'),
        'Email param "s" should be a valid email.');
      err(Validations.email({}, 's', {}, '<john@domain> "test"'),
        'Email param "s" should be a valid email.');
    });
  });

  describe('#simpleValue', () => {
    it('permits string, number, or boolean', () => {
      ok(Validations.simpleValue({}, 's', {}, 'abc'));
      ok(Validations.simpleValue({}, 's', {}, 123));
      ok(Validations.simpleValue({}, 's', {}, true));
      ok(Validations.simpleValue({}, 's', {}, false));
    });

    it('warns if not a string, number or boolean', () => {
      err(Validations.simpleValue({}, 's', {}, [1]),
        'Simple param "s" should be a string, number or boolean.');
      err(Validations.simpleValue({}, 's', {}, {a: 2}),
        'Simple param "s" should be a string, number or boolean.');
    });

    it('warns if required and blank', () => {
      ok(Validations.simpleValue({}, 's', { required: true }, 'val'));
      err(Validations.simpleValue({}, 's', { required: true }, ''),
        'Simple param "s" should not be blank.');
    });
  });

  describe('#number', () => {
    it('permits string number', () => {
      ok(Validations.number({}, 's', {}, '1'));
    });

    it('permits number', () => {
      ok(Validations.number({}, 's', {}, 1.5));
    });

    it('warns if not a number', () => {
      err(Validations.number({}, 's', {}, 'abc'),
        'Number param "s" should be a number.');
    });
  });

  describe('#coords', () => {
    it('permits valid coords', () => {
      ok(Validations.coords({}, 's', {}, [42, -18.3]));
    });

    it('warns if not an array of length 2', () => {
      err(Validations.coords({}, 's', {}, 2),
        'Coords param "s" should be an array of two numbers.');
      err(Validations.coords({}, 's', {}, []),
        'Coords param "s" should be an array of two numbers.');
      err(Validations.coords({}, 's', {}, [1, 2, 3]),
        'Coords param "s" should be an array of two numbers.');
    });

    it('warns if coords are out of bounds', () => {
      err(Validations.coords({}, 's', {}, [-1000, 0]),
        'Coords param "s[0]" should be between -180 and 180.');
      err(Validations.coords({}, 's', {}, [32, 230]),
        'Coords param "s[1]" should be between -180 and 180.');
    });
  });

  describe('#timeShorthand', () => {
    it('permits valid time shorthand', () => {
      ok(Validations.timeShorthand({}, 's', {}, '1:00pm'));
      ok(Validations.timeShorthand({}, 's', {}, '12:59am'));
      ok(Validations.timeShorthand({}, 's', {}, '+1d 10:23a'));
      ok(Validations.timeShorthand({}, 's', {}, '+4d 12:00p'));
    });

    it('rejects invalid time shorthand', () => {
      err(Validations.timeShorthand({}, 's', {}, '10:00x'),
        'Time shorthand param "s" ("10:00x") must be valid.');
      err(Validations.timeShorthand({}, 's', {}, '23:00pm'),
        'Time shorthand param "s" ("23:00pm") must be valid.');
      err(Validations.timeShorthand({}, 's', {}, '3:99a'),
        'Time shorthand param "s" ("3:99a") must be valid.');
      err(Validations.timeShorthand({}, 's', {}, '-1d 2:00pm'),
        'Time shorthand param "s" ("-1d 2:00pm") must be valid.');
      err(Validations.timeShorthand({}, 's', {}, 'd 2:00pm'),
        'Time shorthand param "s" ("d 2:00pm") must be valid.');
    });
  });

  describe('#timeOffset', () => {
    it('permits valid offsets', () => {
      ok(Validations.timeOffset({}, 's', {}, '1h'));
      ok(Validations.timeOffset({}, 's', {}, '-600.234m'));
      ok(Validations.timeOffset({}, 's', {}, '0s'));
      ok(Validations.timeOffset({}, 's', {}, '120s'));
    });

    it('rejects invalid time offsets', () => {
      err(Validations.timeOffset({}, 's', {}, 'h'),
        'Time offset param "s" ("h") should be a number suffixed by "h/m/s".');
      err(Validations.timeOffset({}, 's', {}, '10x'),
        'Time offset param "s" ("10x") should be a number suffixed by "h/m/s".');
      err(Validations.timeOffset({}, 's', {}, '1_345s'),
        'Time offset param "s" ("1_345s") should be a number suffixed by "h/m/s".');
      err(Validations.timeOffset({}, 's', {}, '1.2.3m'),
        'Time offset param "s" ("1.2.3m") should be a number suffixed by "h/m/s".');
      err(Validations.timeOffset({}, 's', {}, '1-6d'),
        'Time offset param "s" ("1-6d") should be a number suffixed by "h/m/s".');
    });
  });

  describe('#name', () => {
    const spec = { type: 'name' };

    it('warns if not a string', () => {
      const result = Validations.name({}, 's', spec, 1);
      err(result, 'Name param "s" ("1") should be a string.');
    });

    it('warns if does not start with a letter', () => {
      err(
        Validations.name({}, 's', spec, '1bc'),
        'Name param "s" ("1bc") should start with a letter.');
      err(
        Validations.name({}, 's', spec, '.bc'),
        'Name param "s" (".bc") should start with a letter.');
    });

    it('warns if contains invalid characters', () => {
      err(Validations.name({}, 's', {}, 'a%b'),
        'Name param "s" ("a%b") should be alphanumeric with dashes or underscores.');
      err(Validations.name({}, 's', {}, 'a"-b'),
        'Name param "s" ("a"-b") should be alphanumeric with dashes or underscores.');
      err(Validations.name({}, 's', {}, 'b^$(D'),
        'Name param "s" ("b^$(D") should be alphanumeric with dashes or underscores.');
    });
  });

  describe('#media', () => {
    it('permits path', () => {
      ok(Validations.media({}, 's', {}, 'abc.mp3'));
    });

    it('warns if not a string', () => {
      err(Validations.media({}, 's', {}, 123),
        'Media param "s" should be a string.');
      err(Validations.media({}, 's', {}, false),
        'Media param "s" should be a string.');
    });

    it('warns if not valid extension', () => {
      const spec = { extensions: ['mp4', 'jpg'] };
      err(Validations.media({}, 's', spec, 'gabe.mp3'),
        'Media param "s" should have one of the following extensions: mp4, jpg.');
    });

    it('warns if required and blank', () => {
      ok(Validations.media({}, 's', { required: true }, 'val'));
      err(Validations.media({}, 's', { required: true }, ''),
        'Media param "s" should not be blank.');
    });
  });

  describe('#enum', () => {
    it('permits if in enum', () => {
      const spec = { type: 'enum', options: [1, true, 'abc'] };
      ok(Validations.enum({}, 's', spec, 1));
      ok(Validations.enum({}, 's', spec, true));
      ok(Validations.enum({}, 's', spec, 'abc'));
    });

    it('warns if not in enum', () => {
      const spec = { type: 'enum', options: [1, true, 'abc'] };
      err(Validations.enum({}, 's', spec, '1'),
        'Enum param "s" is not one of "1", "true", "abc".');
      err(Validations.enum({}, 's', spec, false),
        'Enum param "s" is not one of "1", "true", "abc".');
      err(Validations.enum({}, 's', spec, 'adc'),
        'Enum param "s" is not one of "1", "true", "abc".');
    });
  });

  describe('#simpleAttribute', () => {
    it('permits valid value names', () => {
      ok(Validations.simpleAttribute({}, 's', {}, 'abc'));
      ok(Validations.simpleAttribute({}, 's', {}, 'A12'));
      ok(Validations.simpleAttribute({}, 's', {}, 'A_BC'));
    });

    it('warns if not a string', () => {
      err(Validations.simpleAttribute({}, 's', {}, 1),
        'Simple attribute param "s" should be a string.');
    });

    it('warns if starts with a number', () => {
      err(Validations.simpleAttribute({}, 's', {}, '0'),
        'Simple attribute param "s" ("0") should start with a letter.');
    });

    it('does not allow quotes', () => {
      err(Validations.simpleAttribute({}, 's', {}, '"abc"'),
        'Simple attribute param "s" (""abc"") should start with a letter.');
      err(Validations.simpleAttribute({}, 's', {}, '\'A\''),
        'Simple attribute param "s" ("\'A\'") should start with a letter.');
    });

    it('warns if contains invalid characters', () => {
      err(Validations.simpleAttribute({}, 's', {}, 'a.b'),
        'Simple attribute param "s" ("a.b") should be alphanumeric with underscores.');
      err(Validations.simpleAttribute({}, 's', {}, 'b^$(D'),
        'Simple attribute param "s" ("b^$(D") should be alphanumeric with underscores.');
    });
  });

  describe('#lookupable', () => {
    it('permits valid value names', () => {
      ok(Validations.lookupable({}, 's', {}, 'abc'));
      ok(Validations.lookupable({}, 's', {}, 'A12'));
      ok(Validations.lookupable({}, 's', {}, 'A_BC'));
      ok(Validations.lookupable({}, 's', {}, 'A-BC'));
      ok(Validations.lookupable({}, 's', {}, 'a.b.c'));
      ok(Validations.lookupable({}, 's', {}, '0'));
    });

    it('permits with quotes', () => {
      ok(Validations.lookupable({}, 's', {}, '"abc"'));
      ok(Validations.lookupable({}, 's', {}, '\'A\''));
    });

    it('warns if not a string', () => {
      err(Validations.lookupable({}, 's', {}, 1),
        'Lookupable param "s" ("1") should be a string.');
    });

    it('warns if contains invalid characters', () => {
      err(Validations.lookupable({}, 's', {}, 'a=b'),
        'Lookupable param "s" ("a=b") should be alphanumeric with underscores, dashes and periods.');
      err(Validations.lookupable({}, 's', {}, 'b^$(D'),
        'Lookupable param "s" ("b^$(D") should be alphanumeric with underscores, dashes and periods.');
    });
  });

  describe('#reference', () => {
    const script = { content: { geofences: [{ name: 'GEOFENCE-2' }] } };
    const spec = { type: 'reference', collection: 'geofences' };

    it('permits found references', () => {
      ok(Validations.reference(script, 's', spec, 'GEOFENCE-2'));
    });

    it('warns if reference is not found', () => {
      err(
        Validations.reference(script, 's', spec, 'GEOFENCE-3'),
        'Reference param "s" ("GEOFENCE-3") is not in collection "geofences".');
    });

    it('warns if collection is empty', () => {
      const spec = { type: 'reference', collection: 'messages' };
      err(
        Validations.reference(script, 's', spec, 'GEOFENCE-3'),
        'Reference param "s" ("GEOFENCE-3") is not in collection "messages".');
    });

    it('warns if not a string', () => {
      const result = Validations.reference({}, 's', spec, 1);
      err(result, 'Reference param "s" ("1") should be a string.');
    });

    it('warns if does not start with a letter', () => {
      err(
        Validations.reference({}, 's', spec, '1bc'),
        'Reference param "s" ("1bc") should start with a letter.');
      err(
        Validations.reference({}, 's', spec, '.bc'),
        'Reference param "s" (".bc") should start with a letter.');
    });

    it('warns if contains invalid characters', () => {
      err(Validations.reference({}, 's', {}, 'a%b'),
        'Reference param "s" ("a%b") should be alphanumeric with dashes or underscores.');
      err(Validations.reference({}, 's', {}, 'a"-b'),
        'Reference param "s" ("a"-b") should be alphanumeric with dashes or underscores.');
      err(Validations.reference({}, 's', {}, 'b^$(D'),
        'Reference param "s" ("b^$(D") should be alphanumeric with dashes or underscores.');
    });

    it('permits "null" only if explicitly allowed', () => {
      const specWithNull = {
        type: 'reference',
        collection: 'geofences',
        allowNull: true
      };
      ok(Validations.reference(script, 's', specWithNull, 'null'));
      err(Validations.reference(script, 's', spec, 'null'),
        'Reference param "s" ("null") is not in collection "geofences".');
    });
  });
});
