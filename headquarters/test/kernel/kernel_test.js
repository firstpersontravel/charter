const assert = require('assert');
const moment = require('moment');
const Sequelize = require('sequelize');
const sinon = require('sinon');

const Kernel = require('../../../fptcore/src/kernel/kernel');

const { sandbox } = require('../mocks');
const models = require('../../src/models');
const KernelController = require('../../src/kernel/kernel');
const KernelOpController = require('../../src/kernel/op');
const TestUtil = require('../util');

describe('KernelController', () => {
  describe('#_applyResult', () => {
    const stubTrip = { id: 4 };
    const objs = {
      trip: { id: 1, experienceId: 2, groupId: 3 }
    };

    beforeEach(async () => {
      sandbox.stub(models.Trip, 'findAll').resolves([stubTrip]);
      sandbox.stub(KernelController, 'applyEvent').resolves(null);
    });

    it('applies cross-group events', async () => {
      await KernelController._applyResult(objs, {
        scheduledActions: [],
        resultOps: [
          { operation: 'event', scope: 'group', event: { type: 'hi' } }
        ]
      });

      sinon.assert.calledWith(models.Trip.findAll.firstCall, {
        where: {
          isArchived: false,
          id: { [Sequelize.Op.not]: 1 },
          experienceId: 2,
          groupId: 3
        }
      });
      sinon.assert.calledOnce(KernelController.applyEvent);
      sinon.assert.calledWith(KernelController.applyEvent, 4, { type: 'hi' });
    });

    it('applies cross-experience events', async () => {
      await KernelController._applyResult(objs, {
        scheduledActions: [],
        resultOps: [
          { operation: 'event', scope: 'experience', event: { type: 'hi' } }
        ]
      });

      sinon.assert.calledWith(models.Trip.findAll.firstCall, {
        where: {
          isArchived: false,
          id: { [Sequelize.Op.not]: 1 },
          experienceId: 2
        }
      });
      sinon.assert.calledOnce(KernelController.applyEvent);
      sinon.assert.calledWith(KernelController.applyEvent, 4, { type: 'hi' });
    });
  });

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
      const now = moment.utc();
      const inOneHour = now.clone().add(1, 'hours').toDate();
      const scheduleAction = {
        name: 'set_value',
        params: { value_ref: 'ABC', new_value_ref: 'DEF' },
        scheduleAt: inOneHour
      };
      sandbox.stub(moment, 'utc').returns(now);
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
        type: 'action',
        appliedAt: null,
        createdAt: now.toDate(),
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
