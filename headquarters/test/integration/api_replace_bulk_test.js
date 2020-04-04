const assert = require('assert');
const request = require('supertest');

const app = require('../../src/app');
const TestUtil = require('../util');

describe('API replace bulk', () => {

  let script1;
  let trip1;
  let trip2;
  let trip3;

  beforeEach(async () => {
    script1 = await TestUtil.createDummyScript();
    const script2 = await TestUtil.createDummyScript();
    trip1 = await TestUtil.createDummyTripForScript(script1);
    trip2 = await TestUtil.createDummyTripForScript(script1);
    trip3 = await TestUtil.createDummyTripForScript(script2);
  });

  describe('PUT /api/trips', () => {
    it('updates field in bulk', () => {
      return request(app)
        .put('/api/trips')
        .query({
          orgId: script1.orgId,
          experienceId: script1.experienceId,
          scriptId: script1.id
        })
        .send({ 
          isArchived: true,
          tripState: { currentSceneName: 'updated' }
        })
        .set('Accept', 'application/json')
        .expect(200)
        .then(async (res) => {
          // Test set in DB
          await trip1.reload();
          await trip2.reload();
          await trip3.reload();
          // Only updated trips with script
          assert.strictEqual(trip1.isArchived, true);
          assert.strictEqual(trip2.isArchived, true);
          assert.strictEqual(trip3.isArchived, false);

          // Only updated trips with script
          assert.strictEqual(trip1.tripState.currentSceneName, 'updated');
          assert.strictEqual(trip2.tripState.currentSceneName, 'updated');
          assert(trip3.tripState.currentSceneName !== 'updated');

          // Test updated in response
          assert.strictEqual(res.body.data.trips.length, 2);
        });
    });

    it('requires org and experienceId', () => {
      return request(app)
        .put('/api/trips')
        .query({ orgId: script1.orgId })
        .send({
          isArchived: true,
          tripState: { currentSceneName: 'updated' }
        })
        .set('Accept', 'application/json')
        .expect(400)
        .then(async (res) => {
          assert.deepStrictEqual(res.body.error, {
            message: 'Missing required filter: "experienceId".',
            type: 'BadRequestError'
          });
        });
    });
  });
});
