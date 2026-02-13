const assert = require('assert');

const geofence_exited = require('../../../src/modules/locations/geofence_exited').default;

describe('#geofence_exited', () => {
  it('fires on matching geofence', () => {
    const geoClause = { geofence: 'fence', role: 'Phone' };
    const event = { type: 'geofence', role: 'Phone', geofence: 'fence' };

    const res = geofence_exited.matchEvent(geoClause, event, {});

    assert.strictEqual(res, true);
  });

  it('does not fire on unmatched geofence', () => {
    const geoClause = { geofence: 'fence-2', role: 'Phone' };
    const event = { type: 'geofence', role: 'Phone', geofence: 'fence' };

    const res = geofence_exited.matchEvent(geoClause, event, {});

    assert.strictEqual(res, false);
  });
});
