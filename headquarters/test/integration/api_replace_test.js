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
    it('updates group with new date', () => {
      return request(app)
        .put(`/api/groups/${group.id}`)
        .send({ date: '2018-04-04' })
        .set('Accept', 'application/json')
        .expect(200)
        .then(async (res) => {
          await group.reload();
          // Test group was updated
          assert.strictEqual(group.date, '2018-04-04');
          // Test response
          assert.strictEqual(res.body.data.group.date, '2018-04-04');
        });
    });

    it('rejects badly formatted date', () => {
      return request(app)
        .put(`/api/groups/${group.id}`)
        .send({ date: 'abcd' })
        .set('Accept', 'application/json')
        .expect(422)
        .then(async (res) => {
          assert.deepStrictEqual(res.body, {
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
        .put(`/api/groups/${group.id}`)
        .send({ date: '2000-40-80' })
        .set('Accept', 'application/json')
        .expect(422)
        .then(async (res) => {
          assert.deepStrictEqual(res.body, {
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
        .put(`/api/groups/${group.id}`)
        .send({ date: '2018-01-01T10:00:00Z' })
        .set('Accept', 'application/json')
        .expect(422)
        .then(async (res) => {
          assert.deepStrictEqual(res.body, {
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
        .put(`/api/groups/${group.id}`)
        .send({ date: null })
        .set('Accept', 'application/json')
        .expect(422)
        .then(async (res) => {
          assert.deepStrictEqual(res.body, {
            fields: [{ field: 'date', message: 'must be present' }],
            message: 'Invalid fields: date.',
            type: 'ValidationError'
          });
        });
    });
  });

  describe('PUT /api/participants/:id', () => {
    let participant;

    beforeEach(async () => {
      participant = await models.Participant.find({
        where: { tripId: trip.id }
      });
      await participant.update({ values: { existing: true } });
    });

    it('updates participant with simple value', () => {
      return request(app)
        .put(`/api/participants/${participant.id}`)
        .send({
          roleName: 'newRole',
          currentPageName: 'newPage'
        })
        .set('Accept', 'application/json')
        .expect(200)
        .then(async (res) => {
          await participant.reload();
          assert.deepStrictEqual(res.body, {
            data: {
              participant: {
                currentPageName: 'newPage',
                acknowledgedPageAt: null,
                acknowledgedPageName: '',
                id: participant.id,
                tripId: trip.id,
                roleName: 'newRole',
                userId: null,
                values: { existing: true }
              }
            }
          });
        });
    });
  });
});
