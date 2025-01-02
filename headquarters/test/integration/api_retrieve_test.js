const assert = require('assert');
const request = require('supertest');
const moment = require('moment');

const app = require('../../src/app');
const { mockNow } = require('../mocks');
const { createUserToken } = require('../../src/routes/auth');
const TestUtil = require('../util');

describe('API retrieve', () => {
  const today = moment.utc().format('YYYY-MM-DD');
  let trip;
  let user;

  beforeEach(async () => {
    trip = await TestUtil.createDummyTrip();
    user = await TestUtil.createDummyUser(trip.orgId);
  });

  describe('GET /api/trips/:id', () => {
    it('retrieves trip', () => {
      return request(app)
        .get(`/api/trips/${trip.id}`)
        .set('Authorization', `Bearer ${createUserToken(user, 10)}`)
        .set('Accept', 'application/json')
        .expect(200)
        .then((res) => {
          assert.deepStrictEqual(res.body, {
            data: {
              trip: {
                createdAt: mockNow.toISOString(),
                updatedAt: mockNow.toISOString(),
                id: trip.id,
                experienceId: trip.experienceId,
                scriptId: trip.scriptId,
                orgId: trip.orgId,
                tripState: {
                  currentSceneName: 'SCENE-MAIN',
                  currentPageNamesByRole: {}
                },
                date: today,
                history: {},
                isArchived: false,
                schedule: {},
                scheduleUpdatedAt: null,
                scheduleAt: null,
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
        .set('Authorization', `Bearer ${createUserToken(user, 10)}`)
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
