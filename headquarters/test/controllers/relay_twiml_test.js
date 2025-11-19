const assert = require('assert');
const sinon = require('sinon');

const { sandbox } = require('../mocks');
const models = require('../../src/models');
const RelayTwimlController = require('../../src/controllers/relay_twiml');

describe('RelayTwimlController', () => {
  describe('#_findSiblings', () => {
    it('looks up sibling relays', async () => {
      const relay = { tripId: 3 };
      const stubResult = { id: 2 };
      sandbox.stub(models.Relay, 'findAll').resolves(stubResult);
      
      const res = await RelayTwimlController._findSiblings(relay, 'as', 'with');

      assert.strictEqual(res, stubResult);
      sinon.assert.calledWith(models.Relay.findAll, {
        where: {
          stage: 'test',
          tripId: relay.tripId,
          withRoleName: 'with',
          asRoleName: 'as'
        }
      });
    });
  });
});

