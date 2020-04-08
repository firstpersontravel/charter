const assert = require('assert');
const moment = require('moment');
const request = require('supertest');

const app = require('../../src/app');
const models = require('../../src/models');
const TestUtil = require('../util');

describe('API replace', () => {

  let group;
  let trip;

  beforeEach(async () => {
    trip = await TestUtil.createDummyTrip();
    group = await trip.getGroup();
  });

  describe('PUT /api/groups/:id', () => {
    it('rejects change to date', () => {
      return request(app)
        .put(`/api/groups/${group.id}`)
        .send({ date: '2017-01-03' })
        .set('Accept', 'application/json')
        .expect(422)
        .then(async (res) => {
          assert.deepStrictEqual(res.body.error, {
            fields: [{ field: 'date', message: 'date is readonly' }],
            message: 'Invalid fields: date.',
            type: 'ValidationError'
          });
        });
    });

    it('rejects change to missing field', () => {
      return request(app)
        .put(`/api/groups/${group.id}`)
        .send({ unknown: '1234' })
        .set('Accept', 'application/json')
        .expect(422)
        .then(async (res) => {
          assert.deepStrictEqual(res.body.error, {
            message: 'Invalid field: "unknown".',
            type: 'ValidationError'
          });
        });
    });
  });

  describe('PUT /api/players/:id', () => {
    let player;

    beforeEach(async () => {
      player = await models.Player.findOne({ where: { tripId: trip.id } });
    });

    it('updates player with simple values', () => {
      return request(app)
        .put(`/api/players/${player.id}`)
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
                tripId: trip.id,
                currentPageName: '',
                acknowledgedPageAt: '2018-01-01T00:00:00.000Z',
                acknowledgedPageName: 'newPage',
                roleName: 'Dummy',
                userId: null
              }
            }
          });
        });
    });

    it('rejects changes to immutable fields', () => {
      return request(app)
        .put(`/api/players/${player.id}`)
        .send({ tripId: 100 })
        .set('Accept', 'application/json')
        .expect(422)
        .then(async (res) => {
          assert.deepStrictEqual(res.body.error, {
            fields: [{
              field: 'tripId',
              message: 'tripId is readonly',
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
        .send({ scriptId: 100, groupId: 200 })
        .set('Accept', 'application/json')
        .expect(422)
        .then(async (res) => {
          assert.deepStrictEqual(res.body.error, {
            fields: [{
              field: 'scriptId',
              message: 'scriptId is readonly',
            }, {
              field: 'groupId',
              message: 'groupId is readonly'
            }],
            message: 'Invalid fields: groupId, scriptId.',
            type: 'ValidationError'
          });
        });
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
          .send({ [fieldName]: 'does not matter' })
          .set('Accept', 'application/json')
          .expect(403)
          .then((res) => {
            assert.deepStrictEqual(res.body.error, {
              type: 'ForbiddenError',
              message:
                `Action "update" on field "${fieldName}" of Action ` +
                `#${action.id} by user "default" denied.`
            });
          });
      }));
    });
  });
});
