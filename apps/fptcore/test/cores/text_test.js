const assert = require('assert');
const sinon = require('sinon');

const TextCore = require('../../src/cores/text');

const sandbox = sinon.sandbox.create();

describe('TextCore', () => {

  afterEach(() => {
    sandbox.restore();
  });

  describe('#splitWords', () => {
    it('splits by whitespace', () => {
      assert.deepStrictEqual(TextCore.splitWords('a b c'), ['a', 'b', 'c']);
      assert.deepStrictEqual(TextCore.splitWords(' a b  c'), ['a', 'b', 'c']);
    });

    it('preserves spaces inside quoted strings', () => {
      assert.deepStrictEqual(
        TextCore.splitWords('custom_message "gabe can\'t leave now" to Bob'),
        ['custom_message', '"gabe can\'t leave now"', 'to', 'Bob']);
    });
  });
});
