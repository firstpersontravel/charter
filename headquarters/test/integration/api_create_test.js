const assert = require('assert');
const request = require('supertest');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ScriptCore = require('../../../fptcore/src/cores/script');

const app = require('../../src/app');
const TestUtil = require('../util');

describe('API create', () => {
  describe('POST /api/users', () => {
    let experience;

    beforeEach(async () => {
      experience = await TestUtil.createDummyExperience();
    });

    it('creates user', () => {
      return request(app)
        .post('/api/users')
        .send({
          experienceId: experience.id,
          orgId: experience.orgId,
          firstName: 'Gabe',
          lastName: 'Smedresman'
        })
        .set('Accept', 'application/json')
        .expect(201)
        .then((res) => {
          assert.deepStrictEqual(res.body, {
            data: {
              user: {
                experienceId: experience.id,
                orgId: experience.orgId,
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
        .send({
          id: 123,
          experienceId: experience.id,
          orgId: experience.orgId,
          firstName: 'Gabe',
          lastName: 'Smedresman'
        })
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
        .send({
          experienceId: experience.id,
          orgId: experience.orgId,
          lastName: '123',
          isActive: 2
        })
        .set('Accept', 'application/json')
        .expect(422)
        .then((res) => {
          assert.deepStrictEqual(res.body.error, {
            type: 'ValidationError',
            message: 'Invalid fields: isActive.',
            fields: [
              { field: 'isActive', message: 'must be true or false' }
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
    const scriptContent = {
      meta: { version: ScriptCore.CURRENT_VERSION },
      roles: [{ name: 'hi', title: 'hi', type: 'traveler' }]
    };

    let experience;

    beforeEach(async () => {
      experience = await TestUtil.createDummyExperience();
    });

    it('creates simple script', () => {
      return request(app)
        .post('/api/scripts')
        .send({
          orgId: experience.orgId,
          experienceId: experience.id,
          revision: 0,
          content: scriptContent
        })
        .set('Accept', 'application/json')
        .expect(201)
        .then((res) => {
          // Test content created and returned correctly
          assert.deepStrictEqual(res.body.data.script.content, scriptContent);
          // Test timestamps were added
          assert(res.body.data.script.createdAt);
          assert(res.body.data.script.updatedAt);
        });
    });

    const examples = ['email', 'phonetree', 'roadtrip', 'textconvo',
      'tacosyndicate'];
    
    for (const example of examples) {
      const relativePath = `../../examples/${example}.yaml`;
      const fullPath = path.join(__dirname, relativePath);
      const fullContent = yaml.safeLoad(fs.readFileSync(fullPath, 'utf8'));
      const scriptContent = Object.assign({
        meta: { version: ScriptCore.CURRENT_VERSION }
      }, fullContent.content);

      it(`creates ${example} example`, () => {
        return request(app)
          .post('/api/scripts')
          .send({
            orgId: experience.orgId,
            experienceId: experience.id,
            revision: 0,
            content: scriptContent
          })
          .set('Accept', 'application/json')
          .expect(201)
          .then((res) => {
            assert.deepStrictEqual(res.body.data.script.content,
              scriptContent);
          });
      });
    }

    it('fails on missing meta', () => {
      return request(app)
        .post('/api/scripts')
        .send({
          orgId: experience.orgId,
          experienceId: experience.id,
          revision: 0,
          content: {}
        })
        .set('Accept', 'application/json')
        .expect(422)
        .then((res) => {
          // Test returns an error
          assert.deepStrictEqual(res.body.error, {
            fields: [{
              field: 'content',
              message: 'meta is not of a type(s) object',
              path: 'meta'
            }],
            message: 'Invalid fields: content.',
            type: 'ValidationError'
          });
        });
    });

    it('fails on invalid script content', () => {
      return request(app)
        .post('/api/scripts')
        .send({
          orgId: experience.orgId,
          experienceId: experience.id,
          revision: 0,
          content: {
            meta: { version: ScriptCore.CURRENT_VERSION },
            departures: [{ title: 'x', scene: 'TEST' }]
          }
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
              message: 'Unexpected param "scene" (expected one of: name, title).',
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
          orgId: experience.orgId,
          experienceId: experience.id,
          revision: 0,
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

    let group;

    beforeEach(async () => {
      group = await TestUtil.createDummyGroup();
    });

    it('creates trip', () => {
      return request(app)
        .post('/api/trips')
        .send({
          orgId: group.orgId,
          experienceId: group.experienceId,
          scriptId: group.scriptId,
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
          orgId: group.orgId,
          experienceId: group.experienceId,
          scriptId: group.scriptId,
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
          orgId: trip.orgId,
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
          orgId: trip.orgId,
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
          orgId: trip.orgId,
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
          orgId: trip.orgId,
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
          orgId: trip.orgId,
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
