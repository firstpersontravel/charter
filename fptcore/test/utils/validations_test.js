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
      ok(Validations.string.validate({}, 's', {}, 'abc'));
    });

    it('warns if not a string', () => {
      err(Validations.string.validate({}, 's', {}, []),
        'String param "s" should be a string.');
    });

    it('warns if required and blank', () => {
      ok(Validations.string.validate({}, 's', { required: true }, 'val'));
      err(Validations.string.validate({}, 's', { required: true }, ''),
        'String param "s" should not be blank.');
    });
  });

  describe('#markdown', () => {
    it('permits string', () => {
      ok(Validations.markdown.validate({}, 's', {}, 'abc'));
    });

    it('warns if not a string', () => {
      err(Validations.markdown.validate({}, 's', {}, []),
        'Markdown param "s" should be a string.');
    });

    it('warns if required and blank', () => {
      ok(Validations.markdown.validate({}, 's', { required: true }, 'val'));
      err(Validations.markdown.validate({}, 's', { required: true }, ''),
        'Markdown param "s" should not be blank.');
    });
  });

  describe('#email', () => {
    it('permits email', () => {
      ok(Validations.email.validate({}, 's', {},
        'dispatch@tacosyndicate.family'));
      ok(Validations.email.validate({}, 's', {}, '<test@test.com>'));
    });

    it('permits email and name', () => {
      ok(Validations.email.validate({}, 's', {},
        '"Taco Syndicate Dispatch" <dispatch@tacosyndicate.family>'));
      ok(Validations.email.validate({}, 's', {},
        'Taco Syndicate Dispatch <dispatch@tacosyndicate.family>'));
      ok(Validations.email.validate({}, 's', {},
        '"Gabe\'s Mom" <a-b-c@d_eF.net>'));
    });


    it('warns if not a string', () => {
      err(Validations.email.validate({}, 's', {}, []),
        'Email param "s" should be a string.');
    });

    it('warns if required and blank', () => {
      ok(Validations.email.validate({}, 's', { required: true },
        'val@val.com'));
      err(Validations.email.validate({}, 's', { required: true }, ''),
        'Email param "s" should not be blank.');
    });

    it('warns if not a valid email', () => {
      err(Validations.email.validate({}, 's', {}, 'asdjsadk'),
        'Email param "s" should be a valid email.');
      err(Validations.email.validate({}, 's', {}, 'abc.com'),
        'Email param "s" should be a valid email.');
      err(Validations.email.validate({}, 's', {}, 'john@domain'),
        'Email param "s" should be a valid email.');
      err(Validations.email.validate({}, 's', {}, '"john@domain"'),
        'Email param "s" should be a valid email.');
      err(Validations.email.validate({}, 's', {}, '<john@domain> "test"'),
        'Email param "s" should be a valid email.');
    });
  });

  describe('#simpleValue', () => {
    it('permits string, number, or boolean', () => {
      ok(Validations.simpleValue.validate({}, 's', {}, 'abc'));
      ok(Validations.simpleValue.validate({}, 's', {}, 123));
      ok(Validations.simpleValue.validate({}, 's', {}, true));
      ok(Validations.simpleValue.validate({}, 's', {}, false));
    });

    it('warns if not a string, number or boolean', () => {
      err(Validations.simpleValue.validate({}, 's', {}, [1]),
        'Simple param "s" should be a string, number or boolean.');
      err(Validations.simpleValue.validate({}, 's', {}, {a: 2}),
        'Simple param "s" should be a string, number or boolean.');
    });

    it('warns if required and blank', () => {
      ok(Validations.simpleValue.validate({}, 's', { required: true }, 'val'));
      err(Validations.simpleValue.validate({}, 's', { required: true }, ''),
        'Simple param "s" should not be blank.');
    });
  });

  describe('#number', () => {
    it('permits string number', () => {
      ok(Validations.number.validate({}, 's', {}, '1'));
    });

    it('permits number', () => {
      ok(Validations.number.validate({}, 's', {}, 1.5));
    });

    it('warns if not a number', () => {
      err(Validations.number.validate({}, 's', {}, 'abc'),
        'Number param "s" should be a number.');
    });
  });

  describe('#coords', () => {
    it('permits valid coords', () => {
      ok(Validations.coords.validate({}, 's', {}, [42, -18.3]));
    });

    it('warns if not an array of length 2', () => {
      err(Validations.coords.validate({}, 's', {}, 2),
        'Coords param "s" should be an array of two numbers.');
      err(Validations.coords.validate({}, 's', {}, []),
        'Coords param "s" should be an array of two numbers.');
      err(Validations.coords.validate({}, 's', {}, [1, 2, 3]),
        'Coords param "s" should be an array of two numbers.');
    });

    it('warns if coords are out of bounds', () => {
      err(Validations.coords.validate({}, 's', {}, [-1000, 0]),
        'Coords param "s[0]" should be between -180 and 180.');
      err(Validations.coords.validate({}, 's', {}, [32, 230]),
        'Coords param "s[1]" should be between -180 and 180.');
    });
  });

  describe('#timeShorthand', () => {
    it('permits valid time shorthand', () => {
      ok(Validations.timeShorthand.validate({}, 's', {}, '1:00pm'));
      ok(Validations.timeShorthand.validate({}, 's', {}, '12:59am'));
      ok(Validations.timeShorthand.validate({}, 's', {}, '+1d 10:23a'));
      ok(Validations.timeShorthand.validate({}, 's', {}, '+4d 12:00p'));
    });

    it('rejects invalid time shorthand', () => {
      err(Validations.timeShorthand.validate({}, 's', {}, '10:00x'),
        'Time shorthand param "s" ("10:00x") must be valid.');
      err(Validations.timeShorthand.validate({}, 's', {}, '23:00pm'),
        'Time shorthand param "s" ("23:00pm") must be valid.');
      err(Validations.timeShorthand.validate({}, 's', {}, '3:99a'),
        'Time shorthand param "s" ("3:99a") must be valid.');
      err(Validations.timeShorthand.validate({}, 's', {}, '-1d 2:00pm'),
        'Time shorthand param "s" ("-1d 2:00pm") must be valid.');
      err(Validations.timeShorthand.validate({}, 's', {}, 'd 2:00pm'),
        'Time shorthand param "s" ("d 2:00pm") must be valid.');
    });
  });

  describe('#timeOffset', () => {
    it('permits valid offsets', () => {
      ok(Validations.timeOffset.validate({}, 's', {}, '1h'));
      ok(Validations.timeOffset.validate({}, 's', {}, '-600.234m'));
      ok(Validations.timeOffset.validate({}, 's', {}, '0s'));
      ok(Validations.timeOffset.validate({}, 's', {}, '120s'));
    });

    it('rejects invalid time offsets', () => {
      err(Validations.timeOffset.validate({}, 's', {}, 'h'),
        'Time offset param "s" ("h") should be a number suffixed by "h/m/s".');
      err(Validations.timeOffset.validate({}, 's', {}, '10x'),
        'Time offset param "s" ("10x") should be a number suffixed by "h/m/s".');
      err(Validations.timeOffset.validate({}, 's', {}, '1_345s'),
        'Time offset param "s" ("1_345s") should be a number suffixed by "h/m/s".');
      err(Validations.timeOffset.validate({}, 's', {}, '1.2.3m'),
        'Time offset param "s" ("1.2.3m") should be a number suffixed by "h/m/s".');
      err(Validations.timeOffset.validate({}, 's', {}, '1-6d'),
        'Time offset param "s" ("1-6d") should be a number suffixed by "h/m/s".');
    });
  });

  describe('#name', () => {
    const spec = { type: 'name' };

    it('warns if not a string', () => {
      const result = Validations.name.validate({}, 's', spec, 1);
      err(result, 'Name param "s" ("1") should be a string.');
    });

    it('warns if does not start with a letter', () => {
      err(
        Validations.name.validate({}, 's', spec, '1bc'),
        'Name param "s" ("1bc") should start with a letter.');
      err(
        Validations.name.validate({}, 's', spec, '.bc'),
        'Name param "s" (".bc") should start with a letter.');
    });

    it('warns if contains invalid characters', () => {
      err(Validations.name.validate({}, 's', {}, 'a%b'),
        'Name param "s" ("a%b") should be alphanumeric with dashes or underscores.');
      err(Validations.name.validate({}, 's', {}, 'a"-b'),
        'Name param "s" ("a"-b") should be alphanumeric with dashes or underscores.');
      err(Validations.name.validate({}, 's', {}, 'b^$(D'),
        'Name param "s" ("b^$(D") should be alphanumeric with dashes or underscores.');
    });
  });

  describe('#media', () => {
    it('permits path', () => {
      ok(Validations.media.validate({}, 's', {}, 'abc.mp3'));
    });

    it('warns if not a string', () => {
      err(Validations.media.validate({}, 's', {}, 123),
        'Media param "s" should be a string.');
      err(Validations.media.validate({}, 's', {}, false),
        'Media param "s" should be a string.');
    });

    it('warns if required and blank', () => {
      ok(Validations.media.validate({}, 's', { required: true }, 'val'));
      err(Validations.media.validate({}, 's', { required: true }, ''),
        'Media param "s" should not be blank.');
    });
  });

  describe('#enum', () => {
    it('permits if in enum', () => {
      const spec = { type: 'enum', options: [1, true, 'abc'] };
      ok(Validations.enum.validate({}, 's', spec, 1));
      ok(Validations.enum.validate({}, 's', spec, true));
      ok(Validations.enum.validate({}, 's', spec, 'abc'));
    });

    it('warns if not in enum', () => {
      const spec = { type: 'enum', options: [1, true, 'abc'] };
      err(Validations.enum.validate({}, 's', spec, '1'),
        'Enum param "s" is not one of "1", "true", "abc".');
      err(Validations.enum.validate({}, 's', spec, false),
        'Enum param "s" is not one of "1", "true", "abc".');
      err(Validations.enum.validate({}, 's', spec, 'adc'),
        'Enum param "s" is not one of "1", "true", "abc".');
    });
  });

  describe('#simpleAttribute', () => {
    it('permits valid value names', () => {
      ok(Validations.simpleAttribute.validate({}, 's', {}, 'abc'));
      ok(Validations.simpleAttribute.validate({}, 's', {}, 'A12'));
      ok(Validations.simpleAttribute.validate({}, 's', {}, 'A_BC'));
    });

    it('warns if not a string', () => {
      err(Validations.simpleAttribute.validate({}, 's', {}, 1),
        'Simple attribute param "s" should be a string.');
    });

    it('warns if starts with a number', () => {
      err(Validations.simpleAttribute.validate({}, 's', {}, '0'),
        'Simple attribute param "s" ("0") should start with a letter.');
    });

    it('does not allow quotes', () => {
      err(Validations.simpleAttribute.validate({}, 's', {}, '"abc"'),
        'Simple attribute param "s" (""abc"") should start with a letter.');
      err(Validations.simpleAttribute.validate({}, 's', {}, '\'A\''),
        'Simple attribute param "s" ("\'A\'") should start with a letter.');
    });

    it('warns if contains invalid characters', () => {
      err(Validations.simpleAttribute.validate({}, 's', {}, 'a.b'),
        'Simple attribute param "s" ("a.b") should be alphanumeric with underscores.');
      err(Validations.simpleAttribute.validate({}, 's', {}, 'b^$(D'),
        'Simple attribute param "s" ("b^$(D") should be alphanumeric with underscores.');
    });
  });

  describe('#lookupable', () => {
    it('permits valid value names', () => {
      ok(Validations.lookupable.validate({}, 's', {}, 'abc'));
      ok(Validations.lookupable.validate({}, 's', {}, 'A12'));
      ok(Validations.lookupable.validate({}, 's', {}, 'A_BC'));
      ok(Validations.lookupable.validate({}, 's', {}, 'A-BC'));
      ok(Validations.lookupable.validate({}, 's', {}, 'a.b.c'));
      ok(Validations.lookupable.validate({}, 's', {}, '0'));
    });

    it('permits with quotes', () => {
      ok(Validations.lookupable.validate({}, 's', {}, '"abc"'));
      ok(Validations.lookupable.validate({}, 's', {}, '\'A\''));
    });

    it('warns if not a string', () => {
      err(Validations.lookupable.validate({}, 's', {}, 1),
        'Lookupable param "s" ("1") should be a string.');
    });

    it('warns if contains invalid characters', () => {
      err(Validations.lookupable.validate({}, 's', {}, 'a=b'),
        'Lookupable param "s" ("a=b") should be alphanumeric with underscores, dashes and periods.');
      err(Validations.lookupable.validate({}, 's', {}, 'b^$(D'),
        'Lookupable param "s" ("b^$(D") should be alphanumeric with underscores, dashes and periods.');
    });
  });
});
