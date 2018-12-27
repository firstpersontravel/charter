const assert = require('assert');

const GeofenceCore = require('../../src/cores/geofence');

describe('GeofenceCore', () => {
  describe('#geofencesInArea', () => {
    const scriptContent = {
      geofences: [
        { name: 'cottage', center: 'cottage', distance: 25 },
        { name: 'atlas', center: 'atlas', distance: 25 },
        { name: 'dinner', center: 'dinner', distance: 25 }
      ],
      waypoints: [
        { name: 'cottage', coords: [37.758273, -122.411681] },
        { name: 'atlas', coords: [37.759010, -122.411497] },
        {
          name: 'dinner',
          options: [
            { name: 'eiji', coords: [37.764151, -122.430658] },
            { name: 'schmidts', coords: [37.758769, -122.414902] }
          ]
        }
      ]
    };

    it('returns geofences in area', () => {
      const atCottageResult = GeofenceCore.geofencesInArea(scriptContent,
        37.7582, -122.4116, 5, null);
      assert.strictEqual(atCottageResult.length, 1);
      assert.strictEqual(atCottageResult[0].name, 'cottage');

      const atAtlasResult = GeofenceCore.geofencesInArea(scriptContent,
        37.759010, -122.411497, 5, null);
      assert.strictEqual(atAtlasResult.length, 1);
      assert.strictEqual(atAtlasResult[0].name, 'atlas');
    });

    it('is generous for low accuracy', () => {
      const atCottageResult = GeofenceCore.geofencesInArea(scriptContent,
        37.759010, -122.411497, 100, null);
      assert.strictEqual(atCottageResult.length, 2);
    });

    it('returns option based on waypoint options', () => {
      const atActiveResult = GeofenceCore.geofencesInArea(scriptContent,
        37.758769, -122.414902, 5, { dinner: 'schmidts' });
      assert.strictEqual(atActiveResult.length, 1);
      assert.strictEqual(atActiveResult[0].name, 'dinner');

      const atInactiveResult = GeofenceCore.geofencesInArea(scriptContent,
        37.758769, -122.414902, 5, { dinner: 'eiji' });
      assert.strictEqual(atInactiveResult.length, 0);
    });
  });
});
