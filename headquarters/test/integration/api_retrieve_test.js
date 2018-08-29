const assert = require('assert');
const request = require('supertest');
const moment = require('moment');

const app = require('../../src/app');
const TestUtil = require('../util');

describe('API retrieve', () => {

  const today = moment.utc().format('YYYY-MM-DD');
  let group;
  let playthrough;

  beforeEach(async () => {
    playthrough = await TestUtil.createDummyPlaythrough();
    group = await playthrough.getGroup();
  });

  describe('GET /api/playthroughs/:id', () => {
    it('retrieves playthrough', () => {
      return request(app)
        .get(`/api/playthroughs/${playthrough.id}`)
        .set('Accept', 'application/json')
        .then((res) => {
          assert.deepStrictEqual(res.body, {
            data: {
              playthrough: {
                createdAt: playthrough.createdAt.toISOString(),
                currentSceneName: 'SCENE-MAIN',
                date: today,
                groupId: group.id,
                history: {},
                id: playthrough.id,
                isArchived: false,
                schedule: {},
                departureName: 'T1',
                galleryName: '',
                scriptId: group.scriptId,
                variantNames: '',
                title: 'test',
                values: {}
              }
            }
          });
        });
    });

    it('fails on missing object', () => {
      return request(app)
        .get('/api/playthroughs/12345')
        .set('Accept', 'application/json')
        .expect(404)
        .then((res) => {
          assert.deepStrictEqual(res.body, {
            type: 'NotFoundError',
            message: 'Record not found.'
          });
        });
    });
  });
});
