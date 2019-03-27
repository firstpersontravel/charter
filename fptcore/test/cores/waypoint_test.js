const assert = require('assert');
const sinon = require('sinon');

const WaypointCore = require('../../src/cores/waypoint');

var sandbox = sinon.sandbox.create();

describe('WaypointCore', () => {

  afterEach(() => {
    sandbox.restore();
  });

  const scriptContent = {
    waypoints: [{
      name: 'waypoint1',
      options: [{ name: 'waypoint1' }]
    }, {
      name: 'waypoint_with_options',
      options: [{
        name: 'waypoint2'
      }, {
        name: 'waypoint3'
      }]
    }],
    routes: [{
      name: 'route',
      from: 'waypoint1',
      to: 'waypoint_with_options'
    }],
    directions: [{
      route: 'route',
      from_option: 'waypoint1',
      to_option: 'waypoint2'
    }, {
      route: 'route',
      from_option: 'waypoint1',
      to_option: 'waypoint3'
    }]
  };

  describe('#getAllWaypointOptions', () => {
    it('flattens waypoint options', () => {
      const expected = [{
        name: 'waypoint1'
      }, {
        name: 'waypoint2'
      }, {
        name: 'waypoint3'
      }];
      const result = WaypointCore.getAllWaypointOptions(scriptContent);
      assert.deepStrictEqual(result, expected);
    });
  });

  describe('#optionForWaypoint', () => {
    it('looks up waypoint option', () => {
      const result = WaypointCore.optionForWaypoint(
        scriptContent, 'waypoint_with_options', {
          waypoint_with_options: 'waypoint3'
        });
      assert.deepStrictEqual(result, { name: 'waypoint3' });
    });

    it('choose first option by default', () => {
      const result = WaypointCore.optionForWaypoint(
        scriptContent, 'waypoint_with_options', {});
      assert.deepStrictEqual(result, { name: 'waypoint2' });
    });

    it('choose first option when invalid', () => {
      const result = WaypointCore.optionForWaypoint(
        scriptContent, 'waypoint_with_options', {
          waypoint_with_options: 'invalid'
        });
      assert.deepStrictEqual(result, { name: 'waypoint2' });
    });
  });
});
