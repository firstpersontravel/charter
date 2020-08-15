const assert = require('assert');
const moment = require('moment-timezone');
const sinon = require('sinon');

const { sandbox, mockNow } = require('../mocks');
const SchedulerWorker = require('../../src/workers/scheduler');
const TestUtil = require('../util');
const ActionContext = require('../../src/kernel/action_context');

describe('SchedulerWorker', () => {
  describe('#_getTriggerIntendedAt', () => {
    it('gets time for trigger', () => {
      const trigger = {
        event: { type: 'time_occurred', time: 'time', offset: '10m' }
      };
      const actionContext = {
        evaluateAt: moment.utc(),
        evalContext: {
          schedule: { time: '2018-03-03T04:00:00Z' }
        }
      };

      const res = SchedulerWorker._getTriggerIntendedAt(trigger,
        actionContext);

      const expected = moment
        .utc(actionContext.evalContext.schedule.time)
        .add(10, 'minutes');

      assert.strictEqual(res.unix(), expected.unix());
    });
  });

  describe('#_getTimeOccuranceActions', () => {
    const mockTrip = { orgId: 1, id: 2 };
    const oneHourAgo = mockNow.clone().subtract(1, 'hours');
    const scriptContent = {
      triggers: [{
        event: { type: 'time_occurred', time: '1hAgo', offset: '10m' },
        name: 't1'
      }, {
        event: { type: 'scene_started' },
        name: 't2'
      }, {
        event: { type: 'time_occurred', time: '1hAgo', offset: '-10m' },
        name: 't3'
      }]
    };
    const actionContext = {
      scriptContent: scriptContent,
      evaluateAt: mockNow.clone(),
      _objs: { trip: mockTrip },
      evalContext: { schedule: { '1hAgo': oneHourAgo.toISOString() } }
    };

    it('generates actions for past time triggers', () => {
      const res = SchedulerWorker
        ._getTimeOccuranceActions(actionContext, mockNow.clone());
      assert.strictEqual(res.length, 2);
    });

    it('does not actions for future time triggers', () => {
      const res = SchedulerWorker
        ._getTimeOccuranceActions(actionContext, mockNow.clone().subtract(2, 'hours'));
      assert.strictEqual(res.length, 0);
    });

    it('schedules action for now past time triggers', () => {
      const res = SchedulerWorker
        ._getTimeOccuranceActions(actionContext, mockNow.clone().subtract(1, 'hours'));
      assert.deepStrictEqual(res, [{
        orgId: mockTrip.orgId,
        tripId: mockTrip.id,
        triggeringPlayerId: null,
        type: 'trigger',
        name: 't3',
        params: {},
        triggerName: '',
        createdAt: mockNow.clone(),
        scheduledAt: mockNow.clone()
      }]);
    });

    it('schedules action for intended time of future time triggers', () => {
      const ninetyMinsAgo = oneHourAgo.clone().subtract(30, 'minutes');
      const pastContext = Object.assign({}, actionContext, { evaluateAt: ninetyMinsAgo });
      const res = SchedulerWorker._getTimeOccuranceActions(pastContext, oneHourAgo);
      assert.strictEqual(res.length, 1);
      assert.strictEqual(res[0].name, 't3');
      assert.strictEqual(res[0].createdAt.unix(), mockNow.unix());
      assert.strictEqual(res[0].scheduledAt.unix(),
        oneHourAgo.clone().subtract(10, 'minutes').unix());
    });
  });

  describe('#updateScheduleAts', () => {
    let trip;

    beforeEach(async () => {
      sandbox.stub(SchedulerWorker, '_updateTripNextScheduleAt').resolves();
      trip = await TestUtil.createDummyTrip();
      await trip.update({ scheduleUpdatedAt: mockNow.toDate() });
    });

    it('does not update scheduleAt trip if no recent update', async () => {
      await SchedulerWorker.updateScheduleAts();

      sinon.assert.notCalled(SchedulerWorker._updateTripNextScheduleAt);
    });

    it('updates trip scheduleAt if hasn\'t been updated', async () => {
      await trip.update({ scheduleUpdatedAt: null, updatedAt: mockNow.toDate() });

      await SchedulerWorker.updateScheduleAts();

      sinon.assert.calledOnce(SchedulerWorker._updateTripNextScheduleAt);
      sinon.assert.calledWith(SchedulerWorker._updateTripNextScheduleAt,
        trip.id);
    });

    it('updates trip scheduleAt after trip update', async () => {
      await trip.update({
        updatedAt: mockNow.clone().add(1, 'minute').toDate()
      });

      await SchedulerWorker.updateScheduleAts();

      sinon.assert.calledOnce(SchedulerWorker._updateTripNextScheduleAt);
      sinon.assert.calledWith(SchedulerWorker._updateTripNextScheduleAt,
        trip.id);
    });

    it('updates trip scheduleAt after script update', async () => {
      const script = await trip.getScript();
      await script.update({
        updatedAt: mockNow.clone().add(1, 'minute').toDate()
      });

      await SchedulerWorker.updateScheduleAts();

      sinon.assert.calledOnce(SchedulerWorker._updateTripNextScheduleAt);
      sinon.assert.calledWith(SchedulerWorker._updateTripNextScheduleAt,
        trip.id);
    });
  });

  describe('#_updateTripNextScheduleAt', () => {
    const future = mockNow.clone().add(1, 'hours');
    const scriptContent = {
      triggers: [{
        event: { type: 'time_occurred', time: 't', offset: '10m' },
        name: 't1'
      }, {
        event: { type: 'scene_started' },
        name: 't2'
      }, {
        event: { type: 'time_occurred', time: 't', offset: '-10m' },
        name: 't3'
      }]
    };

    it('updates scheduleAt to next trigger time if future', async () => {
      const objs = {
        trip: {
          id: 1,
          tripState: { currentSceneName: 'main' },
          update: sinon.stub().resolves(),
          experience: {}
        },
        script: { content: scriptContent }
      };
      sandbox.stub(ActionContext, 'createForTripId').resolves({
        evaluateAt: moment.utc(),
        scriptContent: scriptContent,
        evalContext: {
          history: {},
          schedule: { t: future.toISOString() }
        },
        _objs: objs
      });

      await SchedulerWorker._updateTripNextScheduleAt(1);

      sinon.assert.calledOnce(objs.trip.update);
      sinon.assert.calledWith(objs.trip.update.getCall(0), {
        scheduleUpdatedAt: mockNow.toDate(),
        scheduleAt: future.clone().subtract(10, 'minutes').toDate()
      });
    });

    it('updates scheduleAt to now if next trigger is past', async () => {
      const objs = {
        trip: {
          id: 1,
          tripState: { currentSceneName: 'main' },
          update: sinon.stub().resolves(),
          experience: {}
        },
        script: { content: scriptContent }
      };
      sandbox.stub(ActionContext, 'createForTripId').resolves({
        evaluateAt: moment.utc(),
        scriptContent: scriptContent,
        evalContext: {
          history: {},
          schedule: { t: mockNow.toISOString() }
        },
        _objs: objs
      });

      await SchedulerWorker._updateTripNextScheduleAt(1);

      sinon.assert.calledOnce(objs.trip.update);
      sinon.assert.calledWith(objs.trip.update.getCall(0), {
        scheduleUpdatedAt: mockNow.toDate(),
        scheduleAt: mockNow.toDate()
      });
    });

    it('sets scheduleAt to null if no relevant trigger time', async () => {
      const objs = {
        trip: {
          id: 1,
          tripState: { currentSceneName: 'main' },
          update: sinon.stub().resolves(),
          experience: {}
        },
        script: { content: { triggers: [] } }
      };
      sandbox.stub(ActionContext, 'createForTripId').resolves({
        evaluateAt: moment.utc(),
        scriptContent: objs.script.content,
        evalContext: {
          history: {},
          schedule: { t: mockNow.toISOString() }
        },
        _objs: objs
      });

      await SchedulerWorker._updateTripNextScheduleAt(1);

      sinon.assert.calledOnce(objs.trip.update);
      sinon.assert.calledWith(objs.trip.update.getCall(0), {
        scheduleUpdatedAt: mockNow.toDate(),
        scheduleAt: null
      });
    });

    it('skips trigger if in history', async () => {
      const objs = {
        trip: {
          id: 1,
          tripState: { currentSceneName: 'main' },
          update: sinon.stub().resolves(),
          experience: {}
        },
        script: { content: scriptContent }
      };
      sandbox.stub(ActionContext, 'createForTripId').resolves({
        evaluateAt: moment.utc(),
        scriptContent: scriptContent,
        evalContext: {
          history: { t3: true },
          schedule: { t: mockNow.toISOString() }
        },
        _objs: objs
      });

      await SchedulerWorker._updateTripNextScheduleAt(1);

      sinon.assert.calledOnce(objs.trip.update);
      sinon.assert.calledWith(objs.trip.update.getCall(0), {
        scheduleUpdatedAt: mockNow.toDate(),
        scheduleAt: mockNow.clone().add(10, 'minutes').toDate()
      });
    });
  });

  describe('#scheduleActions', () => {
    it.skip('schedules actions for all trips ready for scheduling', () => {});
  });

  describe('#_scheduleTripActions', () => {
    it.skip('schedules time occurrance actions', () => {});
    it.skip('schedules scene started action', () => {});
  });
});
