const assert = require('assert');
const moment = require('moment');
const request = require('supertest');

const app = require('../../src/app');
const models = require('../../src/models');
const TestUtil = require('../util');

describe('API update', () => {

  let trip;

  beforeEach(async () => {
    trip = await TestUtil.createDummyTrip();
    await trip.update({ values: { existing: true, outer: { one: 2 } } });
  });

  describe('PATCH /api/trips/:id', () => {
    it('updates values with shallow merge', () => {
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
            outer: { inner: 'value' }
          });
          // Test updated in response
          assert.deepStrictEqual(res.body.data.trip.values, {
            existing: true,
            outer: { inner: 'value' }
          });
        });
    });

    it('updates values with shallow merge on non-matching type', async () => {
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

  describe('PATCH /api/messages/:id', () => {
    let message;

    beforeEach(async () => {
      const player = await models.Player.find({ 
        where: { tripId: trip.id }
      });
      message = await models.Message.create({
        orgId: trip.orgId,
        tripId: trip.id,
        sentById: player.id,
        sentToId: player.id,
        createdAt: moment.utc(),
        name: 'hi',
        medium: 'text',
        content: 'hi there',
        isInGallery: false,
        isArchived: false
      });
    });

    it('allows change to permitted fields', () => {
      const now = moment.utc();
      const permittedFields = [
        ['isInGallery', true, true],
        ['isArchived', true, true],
        ['readAt', now, now.toISOString()],
        ['replyReceivedAt', now, now.toISOString()]
      ];
      return Promise.all(permittedFields.map(([fieldName, val, valResp]) => {
        return request(app)
          .put(`/api/messages/${message.id}`)
          .send({ [fieldName]: val })
          .set('Accept', 'application/json')
          .expect(200)
          .then(async (res) => {
            assert.strictEqual(res.body.data.message[fieldName], valResp);
          });
      }));
    });

    it('forbids changes to any other field', () => {
      const forbiddenFields = [
        'name',
        'medium',
        'content',
        'sentFromLongitude',
        'sentFromAccuracy'
      ];
      return Promise.all(forbiddenFields.map(fieldName => {
        return request(app)
          .put(`/api/messages/${message.id}`)
          .send({ [fieldName]: 'does not matter' })
          .set('Accept', 'application/json')
          .expect(403)
          .then((res) => {
            assert.deepStrictEqual(res.body.error, {
              type: 'ForbiddenError',
              message:
                `Action "update" on field "${fieldName}" of Message ` +
                `#${message.id} by user "default" denied.`
            });
          });
      }));
    });
  });
});
