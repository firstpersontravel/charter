const assert = require('assert');

const image_received = require('../../../src/modules/messages/image_received');

describe('#image_received', () => {
  const imageClause = { from: 'Gabe', to: 'Cat', medium: 'image' };

  it('fires on matching message', () => {
    const event = {
      type: 'image_received',
      message: { from: 'Gabe', to: 'Cat', medium: 'image' }
    };

    const res = image_received.matchEvent(imageClause, event, {});

    assert.strictEqual(res, true);
  });

  it('does not fire on unmatching message', () => {
    const event = {
      type: 'image_received',
      message: { from: 'Cat', to: 'Gabe', medium: 'image' }
    };

    const res = image_received.matchEvent(imageClause, event, {});

    assert.strictEqual(res, false);
  });

  const geoClause = { geofence: 'cottage' };

  const geoActionContext = {
    evalContext: {
      waypointOptions: {}
    },
    scriptContent: {
      geofences: [{ name: 'cottage', center: 'cottage', distance: 50 }],
      waypoints: [{
        name: 'cottage',
        options: [{
          coords: [37.758273, -122.411681]
        }]
      }]
    }
  };

  it('fires on message inside geofence', () => {
    const event = {
      type: 'image_received',
      message: { from: 'Gabe', to: 'Cat', medium: 'image' },
      location: { latitude: 37.75827, longitude: -122.41168, accuracy: 5 }
    };

    const res = image_received.matchEvent(geoClause, event, geoActionContext);

    assert.strictEqual(res, true);
  });

  it('does not fire on message outside geofence', () => {
    const event = {
      type: 'image_received',
      message: { from: 'Gabe', to: 'Cat', medium: 'image' },
      location: { latitude: 37.75901, longitude: -122.41149, accuracy: 5 }
    };

    const res = image_received.matchEvent(geoClause, event, geoActionContext);

    assert.strictEqual(res, false);
  });
});
