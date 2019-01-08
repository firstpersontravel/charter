const assert = require('assert');
const moment = require('moment');
const sinon = require('sinon');

const fptCore = require('fptcore');

const { sandbox } = require('../mocks');
const models = require('../../src/models');
const TripActionController = require('../../src/controllers/trip_action');
const TripOpController = require('../../src/controllers/trip_op');
const TestUtil = require('../util');

describe('TripActionController', () => {
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
      sandbox.stub(TripOpController, 'applyOp').resolves();
      sandbox.stub(fptCore.ActionCore, 'applyAction')
        .returns({
          resultOps: resultOps,
          scheduledActions: []
        });

      const action = { name: 'signal_cue', params: {} };
      await TripActionController.applyAction(trip.id, action);
      sinon.assert.calledOnce(TripOpController.applyOp);
      assert.deepStrictEqual(
        TripOpController.applyOp.firstCall.args[1],
        resultOps[0]);
    });

    it('schedules an action', async () => {
      const now = moment.utc();
      const inOneHour = now.clone().add(1, 'hours');
      const scheduleAction = {
        name: 'set_value',
        params: { value_ref: 'ABC', new_value_ref: 'DEF' },
        scheduleAt: inOneHour
      };
      sandbox.stub(moment, 'utc').returns(now);
      sandbox.stub(models.Action, 'create').resolves();
      sandbox.stub(fptCore.ActionCore, 'applyAction').returns({
        resultOps: [],
        scheduledActions: [scheduleAction]
      });

      const action = { name: 'signal_cue', params: {} };
      await TripActionController.applyAction(trip.id, action);
      assert.deepStrictEqual(models.Action.create.firstCall.args[0], {
        orgId: 100,
        tripId: 1,
        type: 'action',
        appliedAt: null,
        createdAt: now.toDate(),
        event: null,
        failedAt: null,
        name: 'set_value',
        params: scheduleAction.params,
        scheduledAt: inOneHour.toDate(),
        triggerName: ''
      });
    });
  });
});
