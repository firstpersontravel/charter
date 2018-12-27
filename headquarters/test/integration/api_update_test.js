const assert = require('assert');
const request = require('supertest');

const app = require('../../src/app');
const TestUtil = require('../util');

describe('API update', () => {

  let trip;

  beforeEach(async () => {
    trip = await TestUtil.createDummyTrip();
    await trip.update({ values: { existing: true, outer: { one: 2 } } });
  });

  describe('PATCH /api/trips/:id', () => {
    it('updates value with deep merge', () => {
      return request(app)
        .patch(`/api/trips/${trip.id}`)
        .send({ values: { outer: { inner: 'value' } } })
        .set('Accept', 'application/json')
        .expect(200)
        .then(async (res) => {
          // Test set in DB
          await trip.reload();
          assert.deepStrictEqual(trip.values, {
            existing: true,
            outer: { one: 2, inner: 'value' }
          });
          // Test updated in response
          assert.deepStrictEqual(res.body.data.trip.values, {
            existing: true,
            outer: { one: 2, inner: 'value' }
          });
        });
    });

    it('updates value with deep merge on non-matching type', async () => {
      await trip.update({ values: { outer: 'string' } });
      return request(app)
        .patch(`/api/trips/${trip.id}`)
        .send({ values: { outer: { inner: 'value' } } })
        .set('Accept', 'application/json')
        .expect(200)
        .then(async (res) => {
          assert.deepStrictEqual(res.body.data.trip.values,
            { outer: { inner: 'value' } });
        });
    });
  });
});
