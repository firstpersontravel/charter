const assert = require('assert');
const sinon = require('sinon');

const { sandbox } = require('../mocks');
const models = require('../../src/models');
const RelaysController = require('../../src/controllers/relays');

describe('RelaysController', () => {
  describe('#assignRelayPhoneNumber', () => {
    it.skip('assigns number if available', async () => {});
    it.skip('purchases number if not available', async () => {});
    it.skip('does not overlap other self-assigned relays', async () => {});
    it.skip('does not overlap any other relays if entryway', async () => {});
  });

  describe('#ensureRelay', () => {
    it.skip('returns relay if exists', async () => {});
    it.skip('creates relay if does not exist', async () => {});
  });

  describe('#findByNumber', () => {
    const stubRelay = {
      relayPhoneNumber: '1234567890'
    };

    it('locates relay', async () => {
      // Stub relay find
      sandbox.stub(models.Relay, 'findOne').resolves(stubRelay);

      const result = await RelaysController.findByNumber(
        stubRelay.relayPhoneNumber
      );

      assert.strictEqual(result, stubRelay);
      sinon.assert.calledWith(models.Relay.findOne, {
        where: {
          isActive: true,
          relayPhoneNumber: '1234567890',
          stage: 'test'
        }
      });
    });
  });
});
