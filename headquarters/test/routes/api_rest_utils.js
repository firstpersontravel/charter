const assert = require('assert');
const Sequelize = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite'
});

const Model = sequelize.define('model', {
  title: Sequelize.STRING,
  timestamp: { type: Sequelize.DATE },
  date: { type: Sequelize.DATEONLY },
  isShiny: Sequelize.BOOLEAN
}, {
  timestamps: false
});

async function assertThrows(fn, status, message) {
  let caughtErr = null;
  try {
    await fn();
  } catch(err) {
    caughtErr = err;
  } finally {
    if (!caughtErr) {
      assert.fail('Function should have thrown an error.');
    } else {
      if (!caughtErr.status) {
        assert.fail(`Expected status but got "${caughtErr.message}".`);
      }
      assert.strictEqual(caughtErr.status, status);
      assert.strictEqual(caughtErr.message, message);
    }
  }
}

module.exports = {
  assertThrows: assertThrows,
  Model: Model,
  sequelize: sequelize
};
