const assert = require('assert');
const request = require('supertest');

const app = require('../../src/app');
const models = require('../../src/models');
const TestUtil = require('../util');

describe('API replace', () => {

  let trip;

  beforeEach(async () => {
    trip = await TestUtil.createDummyTrip();
  });

  describe('PATCH /api/players/:id', () => {
    let player;

    beforeEach(async () => {
      player = await models.Player.find({
        where: { tripId: trip.id }
      });
      await player.update({ values: { existing: true } });
    });

    it('updates player with immutable instructions', () => {
      return request(app)
        .patch(`/api/players/${player.id}`)
        .send({ values: { audio: { $set: 'playing' } } })
        .set('Accept', 'application/json')
        .expect(200)
        .then(async (res) => {
          // Test set in DB
          await player.reload();
          assert.deepStrictEqual(player.values, {
            existing: true,
            audio: 'playing'
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
                values: { existing: true, audio: 'playing' }
              }
            }
          });
        });
    });
  });
});
