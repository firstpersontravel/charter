const assert = require('assert');
const moment = require('moment');
const sinon = require('sinon');
const Sequelize = require('sequelize');

const { sandbox } = require('../mocks');
const models = require('../../src/models');
const SchedulerWorker = require('../../src/workers/scheduler');
// const TripActionController = require('../../src/controllers/trip_action');
const TripUtil = require('../../src/controllers/trip_util');

describe('SchedulerWorker', () => {
  describe('#_getTriggerIntendedAt', () => {
    it('gets time for trigger', () => {
      const trigger = {
        events: [{ type: 'time_occurred', time: 'time', offset: '10m' }]
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
        events: [{ type: 'time_occurred', time: '1hAgo', offset: '10m' }],
        name: 't1'
      }, {
        events: [{ type: 'scene_started' }],
        name: 't2'
      }, {
        events: [{ type: 'time_occurred', time: '1hAgo', offset: '-10m' }],
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
    it('queries trips and updates scheduleAt', async () => {
      const mockTrip = { id: 1, experience: { title: 'test' }, title: 'test' };
      sandbox.stub(SchedulerWorker, '_updateTripNextScheduleAt').resolves();
      sandbox.stub(models.Trip, 'findAll').resolves([mockTrip]);

      await SchedulerWorker.updateScheduleAts();

      sinon.assert.calledWith(models.Trip.findAll.getCall(0), {
        where: {
          isArchived: false,
          scheduleUpdatedAt: {
            [Sequelize.Op.or]: [{
              [Sequelize.Op.lte]: Sequelize.col('updatedAt'),
              [Sequelize.Op.lte]: Sequelize.col('script.updatedAt')
            }]
          }
        },
        include: [{
          model: models.Experience,
          as: 'experience',
          where: { isArchived: false }
        }, {
          model: models.Script,
          as: 'script'
        }]
      });
    });
  });

  describe('#_updateTripNextScheduleAt', () => {
    const now = moment.utc();
    const scriptContent = {
      triggers: [{
        events: [{ type: 'time_occurred', time: 'now', offset: '10m' }],
        name: 't1'
      }, {
        events: [{ type: 'scene_started' }],
        name: 't2'
      }, {
        events: [{ type: 'time_occurred', time: 'now', offset: '-10m' }],
        name: 't3'
      }]
    };

    beforeEach(() => {
      const oldMomentUtc = moment.utc;
      sandbox.stub(moment, 'utc').callsFake(arg => (
        arg ? oldMomentUtc(arg) : now
      ));
    });

    it('updates scheduleAt to next trigger time', async () => {
      const objs = {
        trip: { id: 1, update: sinon.stub().resolves(), history: {} },
        script: { content: scriptContent }
      };
      sandbox.stub(TripUtil, 'getObjectsForTrip').resolves(objs);
      sandbox.stub(TripUtil, 'prepareActionContext').returns({
        scriptContent: scriptContent,
        evalContext: { schedule: { now: now.toISOString() } }
      });

      await SchedulerWorker._updateTripNextScheduleAt(objs.trip);

      const args = objs.trip.update.getCall(0).args;
      assert.strictEqual(args[0].scheduleUpdatedAt.unix(), now.unix());
      assert.strictEqual(args[0].scheduleAt.unix(),
        now.clone().subtract(10, 'minutes').unix());
    });

    it('sets scheduleAt to null if no relevant trigger time', async () => {
      const objs = {
        trip: { id: 1, update: sinon.stub().resolves(), history: {} },
        script: { content: { triggers: [] } }
      };
      sandbox.stub(TripUtil, 'getObjectsForTrip').resolves(objs);
      sandbox.stub(TripUtil, 'prepareActionContext').returns({
        scriptContent: objs.script.content,
        evalContext: { schedule: { now: now.toISOString() } }
      });

      await SchedulerWorker._updateTripNextScheduleAt(objs.trip);

      const args = objs.trip.update.getCall(0).args;
      assert.strictEqual(args[0].scheduleUpdatedAt.unix(), now.unix());
      assert.strictEqual(args[0].scheduleAt, null);
    });

    it('skips trigger if in history', async () => {
      const objs = {
        trip: {
          id: 1,
          update: sinon.stub().resolves(),
          history: { t3: true }
        },
        script: { content: scriptContent }
      };
      sandbox.stub(TripUtil, 'getObjectsForTrip').resolves(objs);
      sandbox.stub(TripUtil, 'prepareActionContext').returns({
        scriptContent: scriptContent,
        evalContext: { schedule: { now: now.toISOString() } }
      });

      await SchedulerWorker._updateTripNextScheduleAt(objs.trip);

      const args = objs.trip.update.getCall(0).args;
      assert.strictEqual(args[0].scheduleUpdatedAt.unix(), now.unix());
      assert.strictEqual(args[0].scheduleAt.unix(),
        now.clone().add(10, 'minutes').unix());
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
