const assert = require('assert');
const request = require('supertest');

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
          assert.deepStrictEqual(res.body.data.script.content, {
            roles: [{ name: 'hi' }]
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
});
