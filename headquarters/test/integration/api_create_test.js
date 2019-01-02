const assert = require('assert');
const request = require('supertest');

const app = require('../../src/app');
const models = require('../../src/models');
const TestUtil = require('../util');

describe('API create', () => {
  describe('POST /api/users', () => {
    it('creates user', () => {
      return request(app)
        .post('/api/users')
        .send({ firstName: 'Gabe', lastName: 'Smedresman' })
        .set('Accept', 'application/json')
        .expect(201)
        .then((res) => {
          assert.deepStrictEqual(res.body, {
            data: {
              user: {
                deviceBattery: null,
                deviceId: '',
                deviceLastActive: null,
                devicePushToken: '',
                deviceTimestamp: null,
                email: '',
                firstName: 'Gabe',
                id: 1,
                isActive: true,
                isArchived: false,
                lastName: 'Smedresman',
                locationAccuracy: null,
                locationLatitude: null,
                locationLongitude: null,
                locationTimestamp: null,
                phoneNumber: ''
              }
            }
          });
        });
    });

    it('fails with supplied id', () => {
      return request(app)
        .post('/api/users')
        .send({ id: 123, firstName: 'Gabe', lastName: 'Smedresman' })
        .set('Accept', 'application/json')
        .expect(400)
        .then((res) => {
          assert.deepStrictEqual(res.body.error, {
            type: 'BadRequestError',
            message: 'Id is not allowed on create.'
          });
        });
    });

    it('fails on invalid fields', () => {
      return request(app)
        .post('/api/users')
        .send({ lastName: '123', isActive: 2 })
        .set('Accept', 'application/json')
        .expect(422)
        .then((res) => {
          assert.deepStrictEqual(res.body.error, {
            type: 'ValidationError',
            message: 'Invalid fields: firstName, isActive.',
            fields: [
              { field: 'isActive', message: 'must be true or false' },
              { field: 'firstName', message: 'must be present' }
            ]
          });
        });
    });

    it('forbids creating forbidden models', () => {
      const forbiddenModels = ['Action', 'Message', 'Relay'];
      return Promise.all(forbiddenModels.map(modelName => {
        return request(app)
          .post('/api/' + modelName.toLowerCase() + 's')
          .send({ fields: 'dont matter' })
          .set('Accept', 'application/json')
          .expect(403)
          .then((res) => {
            assert.deepStrictEqual(res.body.error, {
              type: 'ForbiddenError',
              message: 'Action "create" on new ' + modelName +
                ' by user "default" denied.'
            });
          });
      }));
    });
  });

  describe('POST /api/scripts', () => {

    let experience;

    beforeEach(async () => {
      experience = await TestUtil.createDummyExperience();
    });

    it('creates script', () => {
      return request(app)
        .post('/api/scripts')
        .send({
          experienceId: experience.id,
          revision: 0,
          contentVersion: 0,
          content: { roles: [{ name: 'hi' }] }
        })
        .set('Accept', 'application/json')
        .expect(201)
        .then((res) => {
          // Test content created and returned correctly
          assert.deepStrictEqual(res.body.data.script.content, {
            roles: [{ name: 'hi' }]
          });
        });
    });

    it('fails on invalid script content', () => {
      return request(app)
        .post('/api/scripts')
        .send({
          experienceId: experience.id,
          revision: 0,
          contentVersion: 0,
          content: { departures: [{ scene: 'TEST' }] }
        })
        .set('Accept', 'application/json')
        .expect(422)
        .then((res) => {
          // Test returns an error
          assert.deepStrictEqual(res.body.error, {
            fields: [{
              field: 'content',
              message: 'Required param "name" not present.',
              path: 'departures[name=<unknown>]'
            }, {
              field: 'content',
              message: 'Unexpected param "scene" (expected one of: name).',
              path: 'departures[name=<unknown>]'
            }],
            message: 'Invalid fields: content.',
            type: 'ValidationError'
          });
        });
    });

    it('fails on text json content', () => {
      return request(app)
        .post('/api/scripts')
        .send({
          experienceId: experience.id,
          revision: 0,
          contentVersion: 0,
          content: '{ "roles": [{ "name": "hi" }] }'
        })
        .set('Accept', 'application/json')
        .expect(422)
        .then((res) => {
          assert.deepStrictEqual(res.body.error, {
            fields: [{
              field: 'content',
              message: 'must be an object'
            }],
            message: 'Invalid fields: content.',
            type: 'ValidationError'
          });
        });
    });
  });

  describe('POST /api/trips', () => {

    let script;
    let group;

    beforeEach(async () => {
      const experience = await models.Experience.create({
        name: 'test',
        title: 'Test',
        timezone: 'US/Pacific',
      });
      script = await models.Script.create({
        experienceId: experience.id,
        revision: 0,
        contentVersion: 0,
        content: {}
      });
      group = await models.Group.create({
        experienceId: experience.id,
        scriptId: script.id,
        date: '2018-04-02'
      });
    });

    it('creates trip', () => {
      return request(app)
        .post('/api/trips')
        .send({
          experienceId: script.experienceId,
          scriptId: script.id,
          groupId: group.id,
          departureName: 'T3',
          galleryName: 'Test',
          title: 'test',
          date: '2018-04-02',
          schedule: {},
          currentSceneName: 'test',
          values: {},
          variantNames: '',
          isArchived: false
        })
        .set('Accept', 'application/json')
        .expect(201)
        .then((res) => {
          assert.deepStrictEqual(res.body.data.trip.values, {});
        });        
    });

    it('fails on invalid foreign key', () => {
      return request(app)
        .post('/api/trips')
        .send({
          experienceId: script.experienceId,
          scriptId: script.id,
          groupId: 1000,
          departureName: 'T3',
          galleryName: 'Test',
          title: 'test',
          date: '2018-04-02',
          schedule: {},
          currentSceneName: 'test',
          values: {},
          variantNames: '',
          isArchived: false
        })
        .set('Accept', 'application/json')
        .expect(422)
        .then((res) => {
          assert.deepStrictEqual(res.body.error, {
            message: 'Invalid foreign key.',
            type: 'ValidationError'
          });
        });        
    });
  });

  describe('POST /api/groups/:id', () => {
    let trip;

    beforeEach(async () => {
      trip = await TestUtil.createDummyTrip();
    });

    it('creates group with date', () => {
      return request(app)
        .post('/api/groups')
        .send({
          experienceId: trip.experienceId,
          scriptId: trip.scriptId,
          date: '2018-04-04'
        })
        .set('Accept', 'application/json')
        .expect(201)
        .then(async (res) => {
          assert.strictEqual(res.body.data.group.date, '2018-04-04');
        });
    });

    it('rejects badly formatted date', () => {
      return request(app)
        .post('/api/groups')
        .send({
          experienceId: trip.experienceId,
          scriptId: trip.scriptId,
          date: 'abcd'
        })
        .set('Accept', 'application/json')
        .expect(422)
        .then(async (res) => {
          assert.deepStrictEqual(res.body.error, {
            fields: [{
              field: 'date',
              message: 'must be a date in YYYY-MM-DD format'
            }],
            message: 'Invalid fields: date.',
            type: 'ValidationError'
          });
        });
    });

    it('rejects invalid date', () => {
      return request(app)
        .post('/api/groups')
        .send({
          experienceId: trip.experienceId,
          scriptId: trip.scriptId,
          date: '2000-40-80'
        })
        .set('Accept', 'application/json')
        .expect(422)
        .then(async (res) => {
          assert.deepStrictEqual(res.body.error, {
            fields: [{
              field: 'date',
              message: 'must be a date in YYYY-MM-DD format'
            }],
            message: 'Invalid fields: date.',
            type: 'ValidationError'
          });
        });
    });

    it('rejects date with time', () => {
      return request(app)
        .post('/api/groups')
        .send({
          experienceId: trip.experienceId,
          scriptId: trip.scriptId,
          date: '2018-01-01T10:00:00Z'
        })
        .set('Accept', 'application/json')
        .expect(422)
        .then(async (res) => {
          assert.deepStrictEqual(res.body.error, {
            fields: [{
              field: 'date',
              message: 'must be a date in YYYY-MM-DD format'
            }],
            message: 'Invalid fields: date.',
            type: 'ValidationError'
          });
        });
    });

    it('rejects null date', () => {
      return request(app)
        .post('/api/groups')
        .send({
          experienceId: trip.experienceId,
          scriptId: trip.scriptId,
          date: null
        })
        .set('Accept', 'application/json')
        .expect(422)
        .then(async (res) => {
          assert.deepStrictEqual(res.body.error, {
            fields: [{ field: 'date', message: 'must be present' }],
            message: 'Invalid fields: date.',
            type: 'ValidationError'
          });
        });
    });
  });
});
