const assert = require('assert');
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
          assert.deepStrictEqual(res.body, {
            fields: [{ field: 'date', message: 'date is readonly' }],
            message: 'Invalid fields: date.',
            type: 'ValidationError'
          });
        });
    });
  });

  describe('PUT /api/players/:id', () => {
    let player;

    beforeEach(async () => {
      player = await models.Player.find({ where: { tripId: trip.id } });
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
                currentPageName: '',
                acknowledgedPageAt: '2018-01-01T00:00:00.000Z',
                acknowledgedPageName: 'newPage',
                id: player.id,
                tripId: trip.id,
                roleName: 'Dummy',
                userId: null
              }
            }
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
  });
});
