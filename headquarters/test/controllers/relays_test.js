const assert = require('assert');
const sinon = require('sinon');

const { mockNow, sandbox } = require('../mocks');
const config = require('../../src/config');
const models = require('../../src/models');
const RelaysController = require('../../src/controllers/relays');
const TestUtil = require('../util');

describe('RelaysController', () => {
  describe('#getOutgoingRelayService', () => {

    let experience;

    beforeEach(async () => {
      experience = await TestUtil.createDummyExperience();
    });

    it('returns by entryway if present', async () => {
      const relayService = await models.RelayService.create({
        stage: config.env.HQ_STAGE,
        title: 'test',
        phoneNumber: '123',
        sid: '456',
        isShared: false,
        isActive: true,
      });
      await models.RelayEntryway.create({
        orgId: experience.orgId,
        experienceId: experience.id,
        relayServiceId: relayService.id,
        welcome: 'welcome!',
        keyword: ''
      });

      const result = await RelaysController.getOutgoingRelayService(experience.orgId, experience.id);

      assert.strictEqual(result.id, relayService.id);
    });

    it('returns shared if no entryway', async () => {
      const sharedRelayService = await models.RelayService.create({
        stage: config.env.HQ_STAGE,
        title: 'test',
        phoneNumber: '123',
        sid: '456',
        isShared: true,
        isActive: true,
      });

      const result = await RelaysController.getOutgoingRelayService(experience.orgId, experience.id);

      assert.strictEqual(result.id, sharedRelayService.id);
    });

    it('returns null if no active', async () => {
      await models.RelayService.create({
        stage: config.env.HQ_STAGE,
        title: 'test',
        phoneNumber: '789',
        sid: '456',
        isShared: true,
        isActive: false,
      });

      const result = await RelaysController.getOutgoingRelayService(experience.orgId, experience.id);

      assert.strictEqual(result, null);
    });
  });


  describe('#ensureRelay', () => {

    const stubOrgId = 1;
    const stubExpId = 2;
    const stubTripId = 3;
    const stubRelaySpec = { for: 'Abc', with: 'Def' };
    const stubForPhoneNumber = '1112223333';
    const stubRelay = sandbox.stub();
    const stubRelayService = {
      phoneNumber: '4445556666',
      sid: 'MG1234'
    };

    it('returns relay if exists', async () => {
      sandbox.stub(models.Relay, 'findOne').resolves(stubRelay);
      sandbox.stub(models.Relay, 'create').resolves();
      
      const result = await RelaysController.ensureRelay(stubOrgId, stubExpId, stubTripId, stubRelaySpec, stubForPhoneNumber);

      assert.strictEqual(result, stubRelay);

      sinon.assert.calledWith(models.Relay.findOne, {
        where: {
          stage: 'test',
          orgId: stubOrgId,
          experienceId: stubExpId,
          tripId: stubTripId,
          forPhoneNumber: stubForPhoneNumber,
          forRoleName: stubRelaySpec.for,
          withRoleName: stubRelaySpec.with,
          asRoleName: stubRelaySpec.for
        }
      });
      sinon.assert.notCalled(models.Relay.create);
    });

    it('creates relay if does not exist', async () => {
      sandbox.stub(models.Relay, 'findOne').resolves(null);
      sandbox.stub(RelaysController, 'getOutgoingRelayService').resolves(stubRelayService);
      sandbox.stub(models.Relay, 'create').resolves(stubRelay);
      
      const result = await RelaysController.ensureRelay(stubOrgId, stubExpId, stubTripId, stubRelaySpec, stubForPhoneNumber);

      assert.strictEqual(result, stubRelay);

      sinon.assert.calledWith(models.Relay.create, {
        stage: 'test',
        orgId: stubOrgId,
        experienceId: stubExpId,
        tripId: stubTripId,
        forPhoneNumber: stubForPhoneNumber,
        forRoleName: stubRelaySpec.for,
        withRoleName: stubRelaySpec.with,
        asRoleName: stubRelaySpec.for,
        relayPhoneNumber: stubRelayService.phoneNumber,
        messagingServiceId: stubRelayService.sid,
        lastActiveAt: mockNow
      });
    });
  });

  describe('#findByNumber', () => {
    const stubRelay = {
      forPhoneNumber: '4567890000',
      relayPhoneNumber: '1234567890'
    };

    it('locates relay by last activity', async () => {
      // Stub relay find
      sandbox.stub(models.Relay, 'findOne').resolves(stubRelay);

      const result = await RelaysController.findByNumber(
        stubRelay.relayPhoneNumber,
        stubRelay.forPhoneNumber
      );

      assert.strictEqual(result, stubRelay);
      sinon.assert.calledWith(models.Relay.findOne, {
        where: {
          forPhoneNumber: '4567890000',
          relayPhoneNumber: '1234567890',
          stage: 'test'
        },
        order: [
          ['lastActiveAt', 'DESC']
        ]
      });
    });
  });
});
