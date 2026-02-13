const assert = require('assert');
const sinon = require('sinon');

const TextUtil = require('../../src/utils/text').default;

const sandbox = sinon.sandbox.create();

describe('TextUtil', () => {
  afterEach(() => {
    sandbox.restore();
  });

  describe('#formatPhone', () => {
    it('formats a phone number', () => {
      assert.strictEqual(TextUtil.formatPhone('1112223333'), '(111) 222-3333');
      assert.strictEqual(TextUtil.formatPhone('+11112223333'), '(111) 222-3333');
    });
  });

  describe('#varForText', () => {
    it('slugifies a complex name', () => {
      assert.strictEqual(TextUtil.varForText('Bob\'s friend'), 'bobs_friend');
    });

    it('returns null for empty', () => {
      assert.strictEqual(TextUtil.varForText(null), null);
    });
  });

  describe('#splitWords', () => {
    it('splits by whitespace', () => {
      assert.deepStrictEqual(TextUtil.splitWords('a b c'), ['a', 'b', 'c']);
      assert.deepStrictEqual(TextUtil.splitWords(' a b  c'), ['a', 'b', 'c']);
    });

    it('preserves spaces inside quoted strings', () => {
      assert.deepStrictEqual(
        TextUtil.splitWords('custom_message "gabe can\'t leave now" to Bob'),
        ['custom_message', '"gabe can\'t leave now"', 'to', 'Bob']);
    });
  });
});
