const assert = require('assert');
const request = require('supertest');
const moment = require('moment');

const app = require('../../src/app');
const { sandbox } = require('../mocks');
const TestUtil = require('../util');

describe('API retrieve', () => {
  const now = moment.utc();
  const today = moment.utc().format('YYYY-MM-DD');
  let group;
  let trip;

  beforeEach(async () => {
    sandbox.stub(moment, 'utc').returns(now);
    trip = await TestUtil.createDummyTrip();
    group = await trip.getGroup();
  });

  describe('GET /api/trips/:id', () => {
    it('retrieves trip', () => {
      return request(app)
        .get(`/api/trips/${trip.id}`)
        .set('Accept', 'application/json')
        .expect(200)
        .then((res) => {
          assert.deepStrictEqual(res.body, {
            data: {
              trip: {
                createdAt: now.toISOString(),
                updatedAt: now.toISOString(),
                id: trip.id,
                experienceId: trip.experienceId,
                scriptId: trip.scriptId,
                groupId: group.id,
                orgId: trip.orgId,
                currentSceneName: 'SCENE-MAIN',
                date: today,
                history: {},
                isArchived: false,
                schedule: {},
                scheduleUpdatedAt: null,
                scheduleAt: null,
                departureName: '',
                galleryName: '',
                variantNames: '',
                title: 'test',
                values: {},
                customizations: {},
                waypointOptions: {}
              }
            }
          });
        });
    });

    it('fails on missing object', () => {
      return request(app)
        .get('/api/trips/12345')
        .set('Accept', 'application/json')
        .expect(404)
        .then((res) => {
          assert.deepStrictEqual(res.body.error, {
            type: 'NotFoundError',
            message: 'Record not found.'
          });
        });
    });
  });
});
