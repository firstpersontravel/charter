const assert = require('assert');
const moment = require('moment');
const sinon = require('sinon');

const { sandbox } = require('../mocks');
const SchedulerWorker = require('../../src/workers/scheduler');
// const KernelController = require('../../src/kernel/kernel');
const TestUtil = require('../util');
const KernelUtil = require('../../src/kernel/util');

describe('SchedulerWorker', () => {
  describe('#_getTriggerIntendedAt', () => {
    it('gets time for trigger', () => {
      const trigger = {
        event: { type: 'time_occurred', time: 'time', offset: '10m' }
      };
      const actionContext = {
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
    const now = moment.utc();
    const oneHourAgo = now.clone().subtract(1, 'hours');
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
      evalContext: { schedule: { '1hAgo': oneHourAgo.toISOString() } }
    };

    it('generates actions for past time triggers', () => {
      const res = SchedulerWorker._getTimeOccuranceActions(mockTrip, 
        actionContext, now);
      assert.strictEqual(res.length, 2);
    });

    it('does not actions for future time triggers', () => {
      const res = SchedulerWorker._getTimeOccuranceActions(mockTrip, 
        actionContext, now.clone().subtract(2, 'hours'));
      assert.strictEqual(res.length, 0);
    });

    it('schedules action for now past time triggers', () => {
      sandbox.stub(moment, 'utc').returns(now);
      const res = SchedulerWorker._getTimeOccuranceActions(mockTrip, 
        actionContext, now.clone().subtract(1, 'hours'));
      assert.deepStrictEqual(res, [{
        orgId: mockTrip.orgId,
        tripId: mockTrip.id,
        type: 'trigger',
        name: 't3',
        params: {},
        triggerName: '',
        createdAt: now,
        scheduledAt: now
      }]);
    });

    it('schedules action for intended time of future time triggers', () => {
      const now = oneHourAgo.clone().subtract(30, 'minutes');
      const oldMomentUtc = moment.utc;
      sandbox.stub(moment, 'utc').callsFake(arg => (
        arg ? oldMomentUtc(arg) : now
      ));
      const res = SchedulerWorker._getTimeOccuranceActions(mockTrip, 
        actionContext, oneHourAgo);
      assert.strictEqual(res.length, 1);
      assert.strictEqual(res[0].name, 't3');
      assert.strictEqual(res[0].createdAt.unix(), now.unix());
      assert.strictEqual(res[0].scheduledAt.unix(),
        oneHourAgo.clone().subtract(10, 'minutes').unix());
    });
  });

  describe('#updateScheduleAts', () => {
    const now = moment.utc();
    let trip;

    beforeEach(async () => {
      sandbox.stub(moment, 'utc').returns(now);
      sandbox.stub(SchedulerWorker, '_updateTripNextScheduleAt').resolves();
      trip = await TestUtil.createDummyTrip();
      await trip.update({ scheduleUpdatedAt: now.toDate() });
    });

    it('does not update scheduleAt trip if no recent update', async () => {
      await SchedulerWorker.updateScheduleAts();

      sinon.assert.notCalled(SchedulerWorker._updateTripNextScheduleAt);
    });

    it('updates trip scheduleAt if hasn\'t been updated', async () => {
      await trip.update({ scheduleUpdatedAt: null, updatedAt: now.toDate() });

      await SchedulerWorker.updateScheduleAts();

      sinon.assert.calledOnce(SchedulerWorker._updateTripNextScheduleAt);
      sinon.assert.calledWith(SchedulerWorker._updateTripNextScheduleAt,
        trip.id);
    });

    it('updates trip scheduleAt after trip update', async () => {
      await trip.update({
        updatedAt: now.clone().add(1, 'minute').toDate()
      });

      await SchedulerWorker.updateScheduleAts();

      sinon.assert.calledOnce(SchedulerWorker._updateTripNextScheduleAt);
      sinon.assert.calledWith(SchedulerWorker._updateTripNextScheduleAt,
        trip.id);
    });

    it('updates trip scheduleAt after script update', async () => {
      const script = await trip.getScript();
      await script.update({
        updatedAt: now.clone().add(1, 'minute').toDate()
      });

      await SchedulerWorker.updateScheduleAts();

      sinon.assert.calledOnce(SchedulerWorker._updateTripNextScheduleAt);
      sinon.assert.calledWith(SchedulerWorker._updateTripNextScheduleAt,
        trip.id);
    });
  });

  describe('#_updateTripNextScheduleAt', () => {
    const now = moment.utc();
    const future = moment.utc().add(1, 'hours');
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

    beforeEach(() => {
      const oldMomentUtc = moment.utc;
      sandbox.stub(moment, 'utc').callsFake(arg => (
        arg ? oldMomentUtc(arg) : now
      ));
    });

    it('updates scheduleAt to next trigger time if future', async () => {
      const objs = {
        trip: {
          id: 1,
          currentSceneName: 'main',
          update: sinon.stub().resolves(),
          history: {},
          experience: {}
        },
        script: { content: scriptContent }
      };
      sandbox.stub(KernelUtil, 'getObjectsForTrip').resolves(objs);
      sandbox.stub(KernelUtil, 'prepareActionContext').returns({
        scriptContent: scriptContent,
        evalContext: { schedule: { t: future.toISOString() } }
      });

      await SchedulerWorker._updateTripNextScheduleAt(1);

      sinon.assert.calledWith(objs.trip.update.getCall(0), {
        scheduleUpdatedAt: now.toDate(),
        scheduleAt: future.clone().subtract(10, 'minutes').toDate()
      });
    });

    it('updates scheduleAt to now if next trigger is past', async () => {
      const objs = {
        trip: {
          id: 1,
          currentSceneName: 'main',
          update: sinon.stub().resolves(),
          history: {},
          experience: {}
        },
        script: { content: scriptContent }
      };
      sandbox.stub(KernelUtil, 'getObjectsForTrip').resolves(objs);
      sandbox.stub(KernelUtil, 'prepareActionContext').returns({
        scriptContent: scriptContent,
        evalContext: { schedule: { t: now.toISOString() } }
      });

      await SchedulerWorker._updateTripNextScheduleAt(1);

      sinon.assert.calledWith(objs.trip.update.getCall(0), {
        scheduleUpdatedAt: now.toDate(),
        scheduleAt: now.toDate()
      });
    });

    it('sets scheduleAt to null if no relevant trigger time', async () => {
      const objs = {
        trip: {
          id: 1,
          currentSceneName: 'main',
          update: sinon.stub().resolves(),
          history: {},
          experience: {}
        },
        script: { content: { triggers: [] } }
      };
      sandbox.stub(KernelUtil, 'getObjectsForTrip').resolves(objs);
      sandbox.stub(KernelUtil, 'prepareActionContext').returns({
        scriptContent: objs.script.content,
        evalContext: { schedule: { t: now.toISOString() } }
      });

      await SchedulerWorker._updateTripNextScheduleAt(1);

      sinon.assert.calledWith(objs.trip.update.getCall(0), {
        scheduleUpdatedAt: now.toDate(),
        scheduleAt: null
      });
    });

    it('skips trigger if in history', async () => {
      const objs = {
        trip: {
          id: 1,
          currentSceneName: 'main',
          update: sinon.stub().resolves(),
          history: { t3: true },
          experience: {}
        },
        script: { content: scriptContent }
      };
      sandbox.stub(KernelUtil, 'getObjectsForTrip').resolves(objs);
      sandbox.stub(KernelUtil, 'prepareActionContext').returns({
        scriptContent: scriptContent,
        evalContext: { schedule: { t: now.toISOString() } }
      });

      await SchedulerWorker._updateTripNextScheduleAt(1);

      sinon.assert.calledWith(objs.trip.update.getCall(0), {
        scheduleUpdatedAt: now.toDate(),
        scheduleAt: now.clone().add(10, 'minutes').toDate()
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
