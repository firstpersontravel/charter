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
        .then((res) => {
          assert.deepStrictEqual(res.body, {
            data: {
              trip: {
                currentSceneName: 'SCENE-MAIN',
                date: today,
                experienceId: trip.experienceId,
                groupId: group.id,
                history: {},
                id: trip.id,
                isArchived: false,
                lastScheduledTime: null,
                schedule: {},
                departureName: 'T1',
                galleryName: '',
                scriptId: trip.scriptId,
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
          assert.deepStrictEqual(res.body, {
            type: 'NotFoundError',
            message: 'Record not found.'
          });
        });
    });
  });
});
