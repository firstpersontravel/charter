const assert = require('assert');
const request = require('supertest');

const models = require('../../src/models');
const app = require('../../src/app');

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

    it('fails on invalid fields', () => {
      return request(app)
        .post('/api/users')
        .send({ lastName: '123', isActive: 2 })
        .set('Accept', 'application/json')
        .expect(422)
        .then((res) => {
          // console.log('res.body', res.body);
          assert.deepStrictEqual(res.body, {
            type: 'ValidationError',
            message: 'Invalid fields: firstName, isActive.',
            fields: [
              { field: 'isActive', message: 'must be true or false' },
              { field: 'firstName', message: 'must be present' }
            ]
          });
        });
    });
  });

  describe('POST /api/scripts', () => {
    it('creates script', () => {
      return request(app)
        .post('/api/scripts')
        .send({
          name: 'test',
          title: 'Test',
          timezone: 'US/Pacific',
          version: 0,
          content: { roles: [{ name: 'hi' }] }
        })
        .set('Accept', 'application/json')
        .expect(201)
        .then((res) => {
          // Test content created and returned correctly
          assert.deepStrictEqual(res.body.data.script.content, {
            roles: [{ name: 'hi' }]
          });
          // Test created at was set
          assert(res.body.data.script.createdAt);
        });
    });

    it('fails on invalid script content', () => {
      return request(app)
        .post('/api/scripts')
        .send({
          name: 'test',
          title: 'Test',
          timezone: 'US/Pacific',
          version: 0,
          content: { departures: [{ scene: 'TEST' }] }
        })
        .set('Accept', 'application/json')
        .expect(422)
        .then((res) => {
          // Test returns an error
          assert.deepStrictEqual(res.body, {
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
          name: 'test',
          title: 'Test',
          timezone: 'US/Pacific',
          version: 0,
          content: '{ "roles": [{ "name": "hi" }] }'
        })
        .set('Accept', 'application/json')
        .expect(422)
        .then((res) => {
          assert.deepStrictEqual(res.body, {
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
    it('creates trip', async () => {
      const script = await models.Script.create({
        name: 'test',
        title: 'Test',
        timezone: 'US/Pacific',
        version: 0,
        content: {}
      });
      const group = await models.Group.create({
        scriptId: script.id,
        date: '2018-04-02'
      });
      return request(app)
        .post('/api/trips')
        .send({
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

    it('fails on invalid foreign key', async () => {
      const script = await models.Script.create({
        name: 'test',
        title: 'Test',
        timezone: 'US/Pacific',
        version: 0,
        content: {}
      });
      return request(app)
        .post('/api/trips')
        .send({
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
          assert.deepStrictEqual(res.body, {
            message: 'Invalid foreign key.',
            type: 'ValidationError'
          });
        });        
    });
  });
});
