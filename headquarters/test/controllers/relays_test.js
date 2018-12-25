const _ = require('lodash');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const sequelizeFixtures = require('sequelize-fixtures');
const sinon = require('sinon');
const yaml = require('js-yaml');

const models = require('../../src/models');
const RelaysController = require('../../src/controllers/relays');

const sandbox = sinon.sandbox.create();

describe('RelaysController', () => {

  afterEach(() => {
    sandbox.restore();
  });

  const fixturePath = path.join(__dirname, '../fixtures/relays.yaml');
  const fixtures = yaml.safeLoad(fs.readFileSync(fixturePath, 'utf8'));

  beforeEach(() => {
    return sequelizeFixtures.loadFixtures(fixtures, models);
  });

  describe('#findWithParticipantByNumber', () => {
    it('locates relay', async () => {
      const [relay, participant] = await (
        RelaysController.findWithParticipantByNumber(
          _.find(fixtures, { model: 'Relay' }).data.relayPhoneNumber,
          _.find(fixtures, { model: 'User' }).data.phoneNumber)
      );
      assert(relay);
      assert.equal(relay.forRoleName, 'Player');
      assert(participant);
      assert.equal(participant.roleName, 'Player');
    });
  });
});
