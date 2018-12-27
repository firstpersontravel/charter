const assert = require('assert');

const geofenceEvents = require('../../../src/modules/geofence/events');

describe('#geofence_entered', () => {
  it('fires on matching geofence', () => {
    const geoClause = { geofence: 'fence', role: 'Phone' };
    const event = { type: 'geofence', role: 'Phone', geofence: 'fence' };
    const res = geofenceEvents.geofence_entered.matchEvent(
      {}, {}, geoClause, event);
    assert.strictEqual(res, true);
  });

  it('does not fire on unmatched geofence', () => {
    const geoClause = { geofence: 'fence-2', role: 'Phone' };
    const event = { type: 'geofence', role: 'Phone', geofence: 'fence' };
    const res = geofenceEvents.geofence_entered.matchEvent(
      {}, {}, geoClause, event);
    assert.strictEqual(res, false);
  });
});
