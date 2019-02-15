const assert = require('assert');
const request = require('supertest');
const moment = require('moment');

const app = require('../../src/app');
const TestUtil = require('../util');

describe('API retrieve', () => {

  const today = moment.utc().format('YYYY-MM-DD');
  let group;
  let trip;

  beforeEach(async () => {
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
                id: trip.id,
                experienceId: trip.experienceId,
                scriptId: trip.scriptId,
                groupId: group.id,
                orgId: 100,
                currentSceneName: 'SCENE-MAIN',
                date: today,
                history: {},
                isArchived: false,
                lastScheduledTime: null,
                schedule: {},
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
