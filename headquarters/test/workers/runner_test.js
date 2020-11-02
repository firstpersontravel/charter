const sinon = require('sinon');

const { sandbox, mockNow } = require('../mocks');
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
      const stubAction = {
        type: 'action',
        tripId: 123,
        name: 'name',
        params: { param: 1 },
        event: { context: 3 },
        scheduledAt: mockNow,
        update: sandbox.stub().resolves()
      };
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
      sinon.assert.calledWith(stubAction.update, { appliedAt: mockNow });
      sinon.assert.calledWith(KernelController.applyAction,
        123, {
          name: 'name',
          params: stubAction.params,
          event: stubAction.event
        });
    });

    it('catches errors if run in safe mode', async () => {
      const stubAction = {
        type: 'action',
        tripId: 123,
        name: 'name',
        params: { param: 1 },
        event: { context: 3 },
        scheduledAt: mockNow,
        update: sandbox.stub().resolves()
      };
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
      sinon.assert.calledWith(stubAction.update, { failedAt: mockNow });
      sinon.assert.calledWith(KernelController.applyAction,
        123, {
          name: 'name',
          params: stubAction.params,
          event: stubAction.event
        });
    });
  });
});
