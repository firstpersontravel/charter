const assert = require('assert');
const request = require('supertest');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ScriptCore = require('fptcore/src/cores/script');

const { createUserToken } = require('../../src/routes/auth');
const { mockNow } = require('../mocks');
const app = require('../../src/app');
const TestUtil = require('../util');

describe('API create', () => {
  describe('POST /api/participants', () => {
    let experience;
    let user;

    beforeEach(async () => {
      experience = await TestUtil.createDummyExperience();
      user = await TestUtil.createDummyUser(experience.orgId);
    });

    it('creates participant', () => {
      return request(app)
        .post('/api/participants')
        .set('Authorization', `Bearer ${createUserToken(user, 10)}`)
        .send({
          experienceId: experience.id,
          orgId: experience.orgId,
          name: 'Gabe Smedresman'
        })
        .set('Accept', 'application/json')
        .expect(201)
        .then((res) => {
          assert.deepStrictEqual(res.body, {
            data: {
              participant: {
                createdAt: mockNow.toISOString(),
                experienceId: experience.id,
                orgId: experience.orgId,
                deviceBattery: null,
                deviceId: '',
                deviceLastActive: null,
                devicePushToken: '',
                deviceTimestamp: null,
                email: '',
                name: 'Gabe Smedresman',
                id: 1,
                isActive: true,
                isArchived: false,
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
        .post('/api/participants')
        .set('Authorization', `Bearer ${createUserToken(user, 10)}`)
        .send({
          id: 123,
          experienceId: experience.id,
          orgId: experience.orgId,
          name: 'Gabe S',
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
        .post('/api/participants')
        .set('Authorization', `Bearer ${createUserToken(user, 10)}`)
        .send({
          experienceId: experience.id,
          orgId: experience.orgId,
          name: '123',
          isArchived: 'abc'
        })
        .set('Accept', 'application/json')
        .expect(422)
        .then((res) => {
          assert.deepStrictEqual(res.body.error, {
            type: 'ValidationError',
            message: 'Invalid fields: isArchived.',
            fields: [
              { field: 'isArchived', message: 'must be true or false' }
            ]
          });
        });
    });

    it('forbids creating forbidden models', () => {
      const forbiddenModels = {
        Action: { name: 'test' },
        Message: { fromRoleName: 'test' },
        Relay: {}
      };
      return Promise.all(Object.keys(forbiddenModels).map(modelName => {
        return request(app)
          .post('/api/' + modelName.toLowerCase() + 's')
          .set('Authorization', `Bearer ${createUserToken(user, 10)}`)
          .send(forbiddenModels[modelName])
          .set('Accept', 'application/json')
          .expect(403)
          .then((res) => {
            assert.deepStrictEqual(res.body.error, {
              type: 'ForbiddenError',
              message:
                `Action 'create' on record '${modelName.toLowerCase()}' ` +
                'by \'test@test.com\' denied.'
            });
          });
      }));
    });
  });

  describe('POST /api/scripts', () => {
    const scriptContent = {
      meta: { version: ScriptCore.CURRENT_VERSION },
      roles: [{ name: 'hi', title: 'hi' }]
    };

    let experience;
    let user;

    beforeEach(async () => {
      experience = await TestUtil.createDummyExperience();
      user = await TestUtil.createDummyUser(experience.orgId);
    });

    it('creates simple script', () => {
      return request(app)
        .post('/api/scripts')
        .set('Authorization', `Bearer ${createUserToken(user, 10)}`)
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
          .set('Authorization', `Bearer ${createUserToken(user, 10)}`)
          .send({
            orgId: experience.orgId,
            experienceId: experience.id,
            revision: 0,
            content: scriptContent
          })
          .set('Accept', 'application/json')
          .then((res) => {
            assert.deepStrictEqual(res.status, 201);
            assert.deepStrictEqual(res.body.data.script.content,
              scriptContent);
          });
      });
    }

    it('fails on missing meta', () => {
      return request(app)
        .post('/api/scripts')
        .set('Authorization', `Bearer ${createUserToken(user, 10)}`)
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
        .set('Authorization', `Bearer ${createUserToken(user, 10)}`)
        .send({
          orgId: experience.orgId,
          experienceId: experience.id,
          revision: 0,
          content: {
            meta: { version: ScriptCore.CURRENT_VERSION },
            times: [{ title: 'x', scene: 'TEST' }]
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
              path: 'times[name=<unknown>]'
            }, {
              field: 'content',
              message: 'Unexpected param "scene" (expected one of: name, title).',
              path: 'times[name=<unknown>]'
            }],
            message: 'Invalid fields: content.',
            type: 'ValidationError'
          });
        });
    });

    it('fails on text json content', () => {
      return request(app)
        .post('/api/scripts')
        .set('Authorization', `Bearer ${createUserToken(user, 10)}`)
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
    let user;

    beforeEach(async () => {
      group = await TestUtil.createDummyGroup();
      user = await TestUtil.createDummyUser(group.orgId);
    });

    it('creates trip', () => {
      return request(app)
        .post('/api/trips')
        .set('Authorization', `Bearer ${createUserToken(user, 10)}`)
        .send({
          orgId: group.orgId,
          experienceId: group.experienceId,
          scriptId: group.scriptId,
          groupId: group.id,
          title: 'test',
          date: '2018-04-02',
          schedule: {},
          tripState: { currentSceneName: 'test' },
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
        .set('Authorization', `Bearer ${createUserToken(user, 10)}`)
        .send({
          orgId: group.orgId,
          experienceId: group.experienceId,
          scriptId: group.scriptId,
          groupId: 1000,
          title: 'test',
          date: '2018-04-02',
          schedule: {},
          tripState: { currentSceneName: 'test' },
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
    let user;

    beforeEach(async () => {
      trip = await TestUtil.createDummyTrip();
      user = await TestUtil.createDummyUser(trip.orgId);
    });

    it('creates group with date', () => {
      return request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${createUserToken(user, 10)}`)
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
        .set('Authorization', `Bearer ${createUserToken(user, 10)}`)
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
        .set('Authorization', `Bearer ${createUserToken(user, 10)}`)
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
        .set('Authorization', `Bearer ${createUserToken(user, 10)}`)
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
        .set('Authorization', `Bearer ${createUserToken(user, 10)}`)
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
