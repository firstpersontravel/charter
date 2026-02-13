const assert = require('assert');
const sinon = require('sinon');

const Kernel = require('fptcore/src/kernel/kernel').default;

const { sandbox, mockNow } = require('../mocks');
const models = require('../../src/models');
const KernelController = require('../../src/kernel/kernel');
const KernelOpController = require('../../src/kernel/op');
const TestUtil = require('../util');

describe('KernelController', () => {
  describe('#applyAction', () => {
    let trip;

    beforeEach(async () => {
      trip = await TestUtil.createDummyTrip();
    });

    it('invokes result ops', async () => {
      const resultOps = [{
        operation: 'updateTripFields',
        fields: { newField: true }
      }];
      sandbox.stub(KernelOpController, 'applyOp').resolves();
      sandbox.stub(Kernel, 'resultForImmediateAction')
        .returns({
          resultOps: resultOps,
          scheduledActions: []
        });

      const action = { name: 'signal_cue', params: {} };
      await KernelController.applyAction(trip.id, action);
      sinon.assert.calledOnce(KernelOpController.applyOp);
      assert.deepStrictEqual(
        KernelOpController.applyOp.firstCall.args[1],
        resultOps[0]);
    });

    it('schedules an action', async () => {
      const inOneHour = mockNow.clone().add(1, 'hours').toDate();
      const scheduleAction = {
        name: 'set_value',
        params: { value_ref: 'ABC', new_value_ref: 'DEF' },
        scheduleAt: inOneHour
      };
      sandbox.stub(models.Action, 'create').resolves();
      sandbox.stub(Kernel, 'resultForImmediateAction').returns({
        resultOps: [],
        scheduledActions: [scheduleAction]
      });

      const action = { name: 'signal_cue', params: {} };
      await KernelController.applyAction(trip.id, action);
      assert.deepStrictEqual(models.Action.create.firstCall.args[0], {
        orgId: trip.orgId,
        tripId: trip.id,
        triggeringPlayerId: null,
        type: 'action',
        appliedAt: null,
        createdAt: mockNow.toDate(),
        event: null,
        failedAt: null,
        name: 'set_value',
        params: scheduleAction.params,
        scheduledAt: inOneHour,
        triggerName: ''
      });
    });

    it('includes the triggering playerId in scheduled actions', async () => {
      const inOneHour = mockNow.clone().add(1, 'hours').toDate();
      const scheduleAction = {
        name: 'set_value',
        params: { value_ref: 'ABC', new_value_ref: 'DEF' },
        scheduleAt: inOneHour
      };
      sandbox.stub(models.Action, 'create').resolves();
      sandbox.stub(Kernel, 'resultForImmediateAction').returns({
        resultOps: [],
        scheduledActions: [scheduleAction]
      });

      const playerId = 7;
      const action = { name: 'signal_cue' };
      await KernelController.applyAction(trip.id, action, playerId);
      assert.deepStrictEqual(models.Action.create.firstCall.args[0], {
        orgId: trip.orgId,
        tripId: trip.id,
        triggeringPlayerId: playerId,
        type: 'action',
        appliedAt: null,
        createdAt: mockNow.toDate(),
        event: null,
        failedAt: null,
        name: 'set_value',
        params: scheduleAction.params,
        scheduledAt: inOneHour,
        triggerName: ''
      });
    });

  });
});
