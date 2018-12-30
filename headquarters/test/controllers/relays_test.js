const assert = require('assert');
const Sequelize = require('sequelize');
const sinon = require('sinon');

const models = require('../../src/models');
const RelaysController = require('../../src/controllers/relays');

const sandbox = sinon.sandbox.create();

describe('RelaysController', () => {

  afterEach(() => {
    sandbox.restore();
  });

  describe('#purchaseNumber', () => {
    it.skip('purchases a phone number', async () => {});
  });

  describe('#assignRelayPhoneNumber', () => {
    it.skip('assigns number if available', async () => {});
    it.skip('purchases number if not available', async () => {});
  });

  describe('#ensureRelay', () => {
    it.skip('returns relay if exists', async () => {});
    it.skip('creates relay if does not exist', async () => {});
  });

  describe('#findByNumber', () => {

    const stubRelay = {
      relayPhoneNumber: '1234567890',
      userPhoneNumber: '9999999999'
    };

    it('locates relay', async () => {
      // Stub relay find
      sandbox.stub(models.Relay, 'find').resolves(stubRelay);

      const result = await RelaysController.findByNumber(
        stubRelay.relayPhoneNumber,
        stubRelay.userPhoneNumber
      );

      assert.strictEqual(result, stubRelay);
      sinon.assert.calledWith(models.Relay.find, {
        where: {
          isActive: true,
          relayPhoneNumber: '1234567890',
          stage: 'test',
          userPhoneNumber: { [Sequelize.Op.or]: ['', '9999999999'] }
        }
      });
    });
  });
});
