const _ = require('lodash');
const assert = require('assert');
const sinon = require('sinon');

const ContextCore = require('../../src/cores/context');

const sandbox = sinon.sandbox.create();

const env = { host: 'https://test.test' };

describe('ContextCore', () => {
  afterEach(() => {
    sandbox.restore();
  });

  describe('#gatherPlayerContext', () => {
    it('gathers values from player', () => {
      const player = {
        id: 10,
        roleName: 'Vance',
        currentPageName: 'PAGE-NAME',
        user: {
          firstName: 'Vance',
          lastName: 'Farraday'
        }
      };
      const expected = {
        id: 10,
        currentPageName: 'PAGE-NAME',
        link: 'https://test.test/s/10',
        contact_name: 'Vance',
        photo: null,
        facetime: null,
        phone_number: null,
        directive: null,
        skype: null
      };
      const result = ContextCore.gatherPlayerContext(
        env, { id: 1, script: { name: 'test' } }, player);
      assert.deepEqual(result, expected);
    });

    it('gathers directive from script', () => {
      const trip = {
        script: {
          content: {
            pages: [{
              name: 'OTHER-PAGE-NAME',
              directive: 'Go to the Armory'
            }, {
              name: 'PAGE-NAME',
              directive: 'Go to the Tavern'
            }]
          }
        }
      };
      const player = {
        currentPageName: 'PAGE-NAME'
      };
      const result = ContextCore.gatherPlayerContext(env, trip, player);
      assert.equal(result.directive, 'Go to the Tavern');
    });

    it('gathers values from user', () => {
      const player = {
        roleName: 'Dustin',
        user: {
          phoneNumber: '1234567890',
          profile: {
            photo: 'dustin.jpg',
            facetimeUsername: 'dustin'
          }
        }
      };
      const context = { script: { name: 'theheadlandsgamble' } };
      const result = ContextCore.gatherPlayerContext(env, context,
        player);
      assert.equal(result.phone_number, '1234567890');
      assert.equal(result.photo, 'dustin.jpg');
      assert.equal(result.facetime, 'dustin');
    });
  });

  describe('#gatherContext', () => {
    it('gathers all context', () => {
      const trip = {
        currentSceneName: 'SCENE-01',
        schedule: {
          'TIME-123': '2017-02-16T21:44:02Z'
        },
        history: {
          'CUE-123': '2017-02-16T21:44:02Z'
        },
        customizations: { model: 'deluxe' },
        values: { abc: '123' },
        players: [{
          roleName: 'Sarai',
          user: {
            id: 3
          }
        }, {
          roleName: 'Vance',
          user: null
        }]
      };

      const saraiValues = { vals: 's' };
      const vanceValues = { vals: 'v' };
      const subcontextStub = sandbox.stub(ContextCore, 'gatherPlayerContext');
      subcontextStub.onFirstCall().returns(saraiValues);
      subcontextStub.onSecondCall().returns(vanceValues);

      const expected = {
        currentSceneName: 'SCENE-01',
        schedule: trip.schedule,
        history: trip.history,
        model: 'deluxe',
        abc: '123',
        Sarai: saraiValues,
        Vance: vanceValues
      };

      const result = ContextCore.gatherContext(env, trip);
      assert.deepEqual(result, expected);
      sinon.assert.calledWith(subcontextStub, env, trip, trip.players[0]);
      sinon.assert.calledWith(subcontextStub, env, trip, trip.players[1]);
    });

    it('gathers context from waypoint options', () => {
      const trip = {
        script: {
          content: {
            waypoints: [{
              name: 'waypoint1',
              options: [{
                name: 'option1',
                values: { color: 'red' }
              }, {
                name: 'option2',
                values: { color: 'blue' }
              }]
            }]
          }
        },
        currentSceneName: 'SCENE-01',
        waypointOptions: { waypoint1: 'option1' },
        players: []
      };
      // Tests first option
      const res1 = ContextCore.gatherContext(env, trip);
      assert.strictEqual(res1.color, 'red');
      // Tests second option
      trip.waypointOptions.waypoint1 = 'option2';
      const res2 = ContextCore.gatherContext(env, trip);
      assert.strictEqual(res2.color, 'blue');
      // Tests empty
      trip.waypointOptions.waypoint1 = null;
      const res3 = ContextCore.gatherContext(env, trip);
      assert.strictEqual(_.includes(Object.keys(res3), 'color'), false);
      // Tests bad option
      trip.waypointOptions.waypoint1 = 'nonexistent';
      const res4 = ContextCore.gatherContext(env, trip);
      assert.strictEqual(_.includes(Object.keys(res4), 'color'), false);
    });
  });
});
