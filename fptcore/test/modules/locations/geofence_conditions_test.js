const assert = require('assert');

const geofenceConditions =
  require('../../../src/modules/locations/geofence_conditions');

const scriptContent = {
  waypoints: [{
    name: 'w1',
    options: [{
      name: 'sf',
      location: { coords: [37.77604, -122.427428] }
    }, {
      name: 'petaluma',
      location: { coords: [38.239191, -122.634324] }
    }]
  }],
  geofences: [{
    name: 'g1',
    center: 'w1',
    distance: 1000
  }]
};

describe('#role_in_geofence', () => {
  function assertIfEq(ctx, stmt, val) {
    assert.strictEqual(geofenceConditions.role_in_geofence.eval(
      stmt, { scriptContent: scriptContent, evalContext: ctx }), val);
  }

  it('returns true if any role is in geofence', () => {
    const stmt = { op: 'role_in_geofence', role: 'gabe', geofence: 'g1' };
    const context = {
      roleStates: {
        gabe: [
          // One in SF
          { latitude: 37.77604, longitude: -122.427428, accuracy: 30 },
          // One super far away
          { latitude: 23.77604, longitude: -112.427428, accuracy: 30 }
        ]
      },
      waypointOptions: { w1: 'sf' }
    };
    assertIfEq(context, stmt, true);
  });

  it('returns false if no roles are in geofence', () => {
    const stmt = { op: 'role_in_geofence', role: 'gabe', geofence: 'g1' };
    // Loc in SF but waypoint in Petaluma
    const context = {
      roleStates: {
        gabe: [{ latitude: 37.77604, longitude: -122.427428, accuracy: 30 }]
      },
      waypointOptions: { w1: 'petaluma' }
    };
    assertIfEq(context, stmt, false);
  });

  it('returns false if no loc for role', () => {
    const stmt = { op: 'role_in_geofence', role: 'gabe', geofence: 'g1' };
    const context = {
      roleStates: { gabe: [{ latitude: null, longitude: null, accuracy: 0 }] }
    };
    assertIfEq(context, stmt, false);
  });
});
