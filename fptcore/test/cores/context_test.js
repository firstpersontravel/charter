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

  describe('#gatherPlayerEvalContext', () => {
    it('gathers values from player', () => {
      const trip = {
        id: 1,
        script: { name: 'test' },
        tripState: {}
      };
      const player = {
        id: 10,
        roleName: 'Vance',
        user: {
          firstName: 'Vance',
          lastName: 'Farraday',
          email: 'vance@vance.com'
        }
      };
      const expected = {
        link: 'https://test.test/s/10',
        contact_name: 'Vance Farraday',
        photo: null,
        email: 'vance@vance.com',
        facetime: null,
        phone_number: null,
        directive: null,
        skype: null
      };
      const result = ContextCore.gatherPlayerEvalContext(
        env, trip, player);
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
        },
        tripState: {
          currentPageNamesByRole: {
            Tester: 'PAGE-NAME'
          }
        }
      };
      const player = { roleName: 'Tester' };
      const result = ContextCore.gatherPlayerEvalContext(env, trip, player);
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
      const trip = {
        script: { name: 'theheadlandsgamble' },
        tripState: {}
      };
      const result = ContextCore.gatherPlayerEvalContext(env, trip,
        player);
      assert.equal(result.phone_number, '1234567890');
      assert.equal(result.photo, 'dustin.jpg');
      assert.equal(result.facetime, 'dustin');
    });
  });

  describe('#gatherEvalContext', () => {
    it('gathers all context', () => {
      const trip = {
        date: '2014-02-01',
        script: {
          content: {
            roles: [
              { name: 'role-123', title: 'Sarai' },
              { name: 'role-456', title: 'Vance' }
            ]
          }
        },
        tripState: {
          currentSceneName: 'SCENE-01',
          currentPageNamesByRole: {}
        },
        schedule: { 'TIME-123': '2017-02-16T21:44:02Z' },
        history: { 'CUE-123': '2017-02-16T21:44:02Z' },
        waypointOptions: { 'WAYPOINT-1': 'OPTION-1' },
        customizations: { model: 'deluxe' },
        values: { abc: '123' },
        players: [{
          roleName: 'role-123',
          user: { id: 3 }
        }, {
          roleName: 'role-456',
          user: null
        }]
      };

      const saraiValues = { vals: 's' };
      const vanceValues = { vals: 'v' };
      const subcontextStub = sandbox.stub(ContextCore, 'gatherPlayerEvalContext');
      subcontextStub.onFirstCall().returns(saraiValues);
      subcontextStub.onSecondCall().returns(vanceValues);

      const expected = {
        date: 'Saturday, February 1',
        tripState: trip.tripState,
        schedule: trip.schedule,
        history: trip.history,
        waypointOptions: trip.waypointOptions,
        model: 'deluxe',
        abc: '123',
        sarai: saraiValues,
        vance: vanceValues,
        roleStates: {
          'role-123': saraiValues,
          'role-456': vanceValues
        }
      };

      const result = ContextCore.gatherEvalContext(env, trip);
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
        tripState: {
          currentSceneName: 'SCENE-01',
          currentPageNamesByRole: {}
        },
        waypointOptions: { waypoint1: 'option1' },
        players: []
      };
      // Tests first option
      const res1 = ContextCore.gatherEvalContext(env, trip);
      assert.strictEqual(res1.color, 'red');
      // Tests second option
      trip.waypointOptions.waypoint1 = 'option2';
      const res2 = ContextCore.gatherEvalContext(env, trip);
      assert.strictEqual(res2.color, 'blue');
      // Tests empty
      trip.waypointOptions.waypoint1 = null;
      const res3 = ContextCore.gatherEvalContext(env, trip);
      assert.strictEqual(_.includes(Object.keys(res3), 'color'), false);
      // Tests bad option
      trip.waypointOptions.waypoint1 = 'nonexistent';
      const res4 = ContextCore.gatherEvalContext(env, trip);
      assert.strictEqual(_.includes(Object.keys(res4), 'color'), false);
    });
  });
});
