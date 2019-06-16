const moment = require('moment');
const sinon = require('sinon');

const { sandbox } = require('../mocks');
const models = require('../../src/models');
const RunnerWorker = require('../../src/workers/runner');
const KernelController = require('../../src/kernel/kernel');

describe('RunnerWorker', () => {
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
      sandbox.stub(models.Action, 'findAll').resolves([stubAction]);
      sandbox.stub(KernelController, 'applyAction').resolves();

      await RunnerWorker.runScheduledActions();
      sinon.assert.calledWith(models.Action.findAll, {
        order: [['scheduledAt', 'ASC'], ['id', 'ASC']],
        where: { isArchived: false, appliedAt: null, failedAt: null },
        include: [{
          model: models.Trip,
          as: 'trip',
          where: { isArchived: false }
        }]
      });
      sinon.assert.calledWith(stubAction.update, { appliedAt: now });
      sinon.assert.calledWith(KernelController.applyAction,
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
      sandbox.stub(models.Action, 'findAll').resolves([stubAction]);
      sandbox.stub(KernelController, 'applyAction')
        .rejects(new Error('failed action'));

      await RunnerWorker.runScheduledActions(null, null, true);
      sinon.assert.calledWith(models.Action.findAll, {
        order: [['scheduledAt', 'ASC'], ['id', 'ASC']],
        where: { isArchived: false, appliedAt: null, failedAt: null },
        include: [{
          model: models.Trip,
          as: 'trip',
          where: { isArchived: false }
        }]
      });
      sinon.assert.calledWith(stubAction.update, { failedAt: now });
      sinon.assert.calledWith(KernelController.applyAction,
        123, {
          name: 'name',
          params: stubAction.params,
          event: stubAction.event
        });
    });
  });
});
