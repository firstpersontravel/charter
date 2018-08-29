const sinon = require('sinon');

const sandbox = sinon.sandbox.create();

describe('UserController', () => {

  afterEach(() => {
    sandbox.restore();
  });

  describe('#updateDeviceState', () => {

    it.skip('updates device state', () => {});

    it.skip('skips location update if old', () => {});

    it.skip('triggers entering geofences', () => {});

  });
});
