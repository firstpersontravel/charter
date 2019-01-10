const assert = require('assert');

const models = require('../../src/models');
const TripUtil = require('../../src/controllers/trip_util');

describe('TripUtil', () => {
  describe('#getObjectsForTrip', () => {
    it.skip('gets all needed objects for a trip', () => {});
  });

  describe('#prepareEvalContext', () => {
    it('creates trip context', () => {
      const objs = {
        experience: {
          domain: 'test.x.com'
        },
        script: models.Script.build({
          content: {
            pages: [{
              name: 'PAGE-1',
              directive: 'Go to the mall.'
            }]
          }
        }),
        trip: models.Trip.build({
          currentSceneName: 'SCENE-1',
          schedule: { 'TIME-1': 'time' },
          history: { 'CUE-1': 'time' }
        }),
        players: [models.Player.build({
          roleName: 'Role',
          id: 123,
          currentPageName: 'PAGE-1'
        })]
      };

      const res = TripUtil.prepareEvalContext(objs);

      assert.deepStrictEqual(res, {
        currentSceneName: 'SCENE-1',
        schedule: { 'TIME-1': 'time' },
        history: { 'CUE-1': 'time' },
        Role: {
          contact_name: null,
          currentPageName: 'PAGE-1',
          directive: 'Go to the mall.',
          facetime: null,
          id: 123,
          link: 'https://test.x.com/s/123',
          phone_number: null,
          photo: null,
          skype: null
        }
      });
    });
  });
});
