const assert = require('assert');
const request = require('supertest');

const app = require('../../src/app');
const models = require('../../src/models');
const TestUtil = require('../util');

describe('API update', () => {

  let trip;

  beforeEach(async () => {
    trip = await TestUtil.createDummyTrip();
  });

  describe('PATCH /api/players/:id', () => {
    let player;

    beforeEach(async () => {
      player = await models.Player.find({ where: { tripId: trip.id } });
      await player.update({ values: { existing: true, outer: { one: 2 } } });
    });

    it('updates value with deep merge', () => {
      return request(app)
        .patch(`/api/players/${player.id}`)
        .send({ values: { outer: { inner: 'value' } } })
        .set('Accept', 'application/json')
        .expect(200)
        .then(async (res) => {
          // Test set in DB
          await player.reload();
          assert.deepStrictEqual(player.values, {
            existing: true,
            outer: { one: 2, inner: 'value' }
          });
          // Test updated in response
          assert.deepStrictEqual(res.body, {
            data: {
              player: {
                currentPageName: 'PAGE',
                acknowledgedPageAt: null,
                acknowledgedPageName: '',
                id: player.id,
                tripId: trip.id,
                roleName: 'Dummy',
                userId: null,
                values: { existing: true, outer: { one: 2, inner: 'value' } }
              }
            }
          });
        });
    });

    it('updates value with deep merge on non-matching type', async () => {
      await player.update({ values: { outer: 'string' } });
      return request(app)
        .patch(`/api/players/${player.id}`)
        .send({ values: { outer: { inner: 'value' } } })
        .set('Accept', 'application/json')
        .expect(200)
        .then(async (res) => {
          assert.deepStrictEqual(res.body.data.player.values,
            { outer: { inner: 'value' } });
        });
    });
  });
});
