// const assert = require('assert');
// const moment = require('moment');
const sinon = require('sinon');

// const models = require('../../src/models');
// const TripResetController = require('../../src/controllers/trip_reset');

const sandbox = sinon.sandbox.create();

describe('TripResetController', () => {

  afterEach(() => {
    sandbox.restore();
  });

  describe('#resetToCheckpoint', () => {
    it.skip('resets', () => {});
  });
});
