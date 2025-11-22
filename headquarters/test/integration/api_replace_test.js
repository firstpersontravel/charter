const assert = require('assert');
const moment = require('moment');
const request = require('supertest');

const app = require('../../src/app');
const models = require('../../src/models');
const { createUserToken } = require('../../src/routes/auth');
const TestUtil = require('../util');

describe('API replace', () => {

  let trip;
  let user;

  beforeEach(async () => {
    trip = await TestUtil.createDummyTrip();
    user = await TestUtil.createDummyUser(trip.orgId);
  });

  describe('PUT /api/players/:id', () => {
    let player;

    beforeEach(async () => {
      player = await models.Player.findOne({ where: { tripId: trip.id } });
    });

    it('updates player with simple values', () => {
      return request(app)
        .put(`/api/players/${player.id}`)
        .set('Authorization', `Bearer ${createUserToken(user, 10)}`)
        .send({
          acknowledgedPageName: 'newPage',
          acknowledgedPageAt: '2018-01-01T00:00:00Z'
        })
        .set('Accept', 'application/json')
        .expect(200)
        .then(async (res) => {
          await player.reload();
          assert.deepStrictEqual(res.body, {
            data: {
              player: {
                id: player.id,
                orgId: trip.orgId,
                experienceId: trip.experienceId,
                tripId: trip.id,
                acknowledgedPageAt: '2018-01-01T00:00:00.000Z',
                acknowledgedPageName: 'newPage',
                roleName: 'Dummy',
                participantId: null
              }
            }
          });
        });
    });

    it('rejects changes to immutable fields', () => {
      return request(app)
        .put(`/api/players/${player.id}`)
        .set('Authorization', `Bearer ${createUserToken(user, 10)}`)
        .send({ tripId: 100 })
        .set('Accept', 'application/json')
        .expect(422)
        .then(async (res) => {
          assert.deepStrictEqual(res.body.error, {
            fields: [{
              field: 'tripId',
              message: '(noUpdateAttributes): `tripId` cannot be updated due to `readOnly` constraint.',
            }],
            message: 'Invalid fields: tripId.',
            type: 'ValidationError'
          });
        });
    });
  });

  describe('PUT /api/trips/:id', () => {
    beforeEach(async () => {
      await trip.update({ values: { existing: true, outer: { one: 2 } } });
    });

    it('replaces values completely', () => {
      return request(app)
        .put(`/api/trips/${trip.id}`)
        .set('Authorization', `Bearer ${createUserToken(user, 10)}`)
        .send({ values: { outer: { inner: 'value' } } })
        .set('Accept', 'application/json')
        .expect(200)
        .then(async (res) => {
          // Test set in DB
          await trip.reload();
          assert.deepStrictEqual(trip.values, {
            outer: { inner: 'value' }
          });
          // Test updated in response
          assert.deepStrictEqual(res.body.data.trip.values, {
            outer: { inner: 'value' }
          });
        });
    });

    it('rejects changes to immutable fields', () => {
      return request(app)
        .put(`/api/trips/${trip.id}`)
        .set('Authorization', `Bearer ${createUserToken(user, 10)}`)
        .send({ scriptId: 100 })
        .set('Accept', 'application/json')
        .expect(422)
        .then(async (res) => {
          assert.deepStrictEqual(res.body.error, {
            fields: [{
              field: 'scriptId',
              message: '(noUpdateAttributes): `scriptId` cannot be updated due to `readOnly` constraint.'
            }],
            message: 'Invalid fields: scriptId.',
            type: 'ValidationError'
          });
        });
    });
  });

  describe('PUT /api/scripts/:id', () => {
    it('succeeds when If-Unmodified-Since matches updatedAt', async () => {
      const script = await trip.getScript();
      const lastModified = trip.updatedAt.toISOString();
      return request(app)
        .put(`/api/scripts/${script.id}`)
        .set('Authorization', `Bearer ${createUserToken(user, 10)}`)
        .set('Accept', 'application/json')
        .set('If-Unmodified-Since', lastModified)
        .send({ content: script.content })
        .expect(200);
    });

    it('fails when If-Unmodified-Since is earlier than updatedAt', async () => {
      const script = await trip.getScript();
      const oldDate = moment.utc().subtract(1, 'day').toISOString();
      return request(app)
        .put(`/api/scripts/${trip.scriptId}`)
        .set('Authorization', `Bearer ${createUserToken(user, 10)}`)
        .set('Accept', 'application/json')
        .set('If-Unmodified-Since', oldDate)
        .send(Object.assign({}, script.content, { content: script.content }))
        .expect(412);
    });
  });

  describe('PUT /api/actions/:id', () => {
    let action;

    beforeEach(async () => {
      action = await models.Action.create({
        orgId: trip.orgId,
        tripId: trip.id,
        type: 'action',
        name: 'signal_cue',
        params: { cue_name: 'hi' },
        createdAt: moment.utc(),
        scheduledAt: moment.utc(),
        isArchived: false
      });
    });

    it('allows change to isArchived', () => {
      return request(app)
        .put(`/api/actions/${action.id}`)
        .set('Authorization', `Bearer ${createUserToken(user, 10)}`)
        .send({ isArchived: true })
        .set('Accept', 'application/json')
        .expect(200)
        .then(async (res) => {
          // Test set in DB
          await action.reload();
          assert.strictEqual(action.isArchived, true);
          // Test updated in response
          assert.strictEqual(res.body.data.action.isArchived, true);
        });
    });

    it('forbids changes to any other field', () => {
      const forbiddenFields = ['name', 'params', 'type'];
      return Promise.all(forbiddenFields.map(fieldName => {
        return request(app)
          .put(`/api/actions/${action.id}`)
          .set('Authorization', `Bearer ${createUserToken(user, 10)}`)
          .send({ [fieldName]: 'does not matter' })
          .set('Accept', 'application/json')
          .expect(403)
          .then((res) => {
            assert.deepStrictEqual(res.body.error, {
              type: 'ForbiddenError',
              message:
                `Action 'update' on field '${fieldName}' of record ` +
                `'action #${action.id}' by 'test@test.com' denied.`
            });
          });
      }));
    });
  });
});
