const assert = require('assert');
const request = require('supertest');

const app = require('../../src/app');
const models = require('../../src/models');
const TestUtil = require('../util');

describe('API replace', () => {

  let playthrough;

  beforeEach(async () => {
    playthrough = await TestUtil.createDummyPlaythrough();
  });

  describe('PATCH /api/participants/:id', () => {
    let participant;

    beforeEach(async () => {
      participant = await models.Participant.find({
        where: { playthroughId: playthrough.id }
      });
      await participant.update({ values: { existing: true } });
    });

    it('updates participant with immutable instructions', () => {
      return request(app)
        .patch(`/api/participants/${participant.id}`)
        .send({ values: { audio: { $set: 'playing' } } })
        .set('Accept', 'application/json')
        .expect(200)
        .then(async (res) => {
          // Test set in DB
          await participant.reload();
          assert.deepStrictEqual(participant.values, {
            existing: true,
            audio: 'playing'
          });
          // Test updated in response
          assert.deepStrictEqual(res.body, {
            data: {
              participant: {
                currentPageName: 'PAGE',
                acknowledgedPageAt: null,
                acknowledgedPageName: '',
                id: participant.id,
                playthroughId: playthrough.id,
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
