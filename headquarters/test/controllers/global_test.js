const moment = require('moment');
const Promise = require('bluebird');
const sinon = require('sinon');

const models = require('../../src/models');
const GlobalController = require('../../src/controllers/global');
const TripActionController = require('../../src/controllers/trip_action');

const sandbox = sinon.sandbox.create();

describe('GlobalController', () => {

  afterEach(() => {
    sandbox.restore();
  });

  describe('#scheduleActions', () => {
    it.skip('schedules time occurred', () => {});
    it.skip('schedules scene start if needed', () => {});
  });

  describe('#runScheduledActions', () => {

    it('runs successfully', async () => {
      const now = moment.utc();
      const stubAction = {
        type: 'action',
        tripId: 123,
        name: 'name',
        params: { param: 1 },
        event: { context: 3 },
        scheduledAt: now,
        update: sandbox.stub().resolves()
      };
      sandbox.stub(moment, 'utc').returns(now);
      sandbox.stub(models.Action, 'findAll')
        .returns(Promise.all([stubAction]));
      sandbox.stub(TripActionController, 'applyAction')
        .resolves();

      await GlobalController.runScheduledActions();
      sinon.assert.calledWith(models.Action.findAll, {
        order: [['scheduledAt', 'ASC'], ['id', 'ASC']],
        where: { isArchived: false, appliedAt: null, failedAt: null },
        include: [{
          model: models.Trip,
          as: 'trip',
          where: { isArchived: false }
        }]
      });
      sinon.assert.calledWith(stubAction.update, {
        appliedAt: now
      });
      sinon.assert.calledWith(TripActionController.applyAction,
        123, {
          name: 'name',
          params: stubAction.params,
          event: stubAction.event
        });
    });

    it('catches errors if run in safe mode', async () => {
      const now = moment.utc();
      const stubAction = {
        type: 'action',
        tripId: 123,
        name: 'name',
        params: { param: 1 },
        event: { context: 3 },
        scheduledAt: now,
        update: sandbox.stub().resolves()
      };
      sandbox.stub(moment, 'utc').returns(now);
      sandbox.stub(models.Action, 'findAll')
        .returns(Promise.all([stubAction]));
      sandbox.stub(TripActionController, 'applyAction')
        .rejects(new Error('failed action'));

      await GlobalController.runScheduledActions(null, null, true);
      sinon.assert.calledWith(models.Action.findAll, {
        order: [['scheduledAt', 'ASC'], ['id', 'ASC']],
        where: { isArchived: false, appliedAt: null, failedAt: null },
        include: [{
          model: models.Trip,
          as: 'trip',
          where: { isArchived: false }
        }]
      });
      sinon.assert.calledWith(stubAction.update, {
        failedAt: now
      });
      sinon.assert.calledWith(TripActionController.applyAction,
        123, {
          name: 'name',
          params: stubAction.params,
          event: stubAction.event
        });
    });
  });
});
