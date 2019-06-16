const assert = require('assert');

const audio_received = require('../../../src/modules/messages/audio_received');

describe('#audio_received', () => {
  const audioClause = { from: 'Gabe', to: 'Cat', medium: 'audio' };

  it('fires on matching message', () => {
    const event = {
      type: 'audio_received',
      message: { from: 'Gabe', to: 'Cat', medium: 'audio' }
    };

    const res = audio_received.matchEvent(audioClause, event, {});

    assert.strictEqual(res, true);
  });

  it('does not fire on unmatching message', () => {
    const event = {
      type: 'audio_received',
      message: { from: 'Cat', to: 'Gabe', medium: 'audio' }
    };

    const res = audio_received.matchEvent(audioClause, event, {});

    assert.strictEqual(res, false);
  });

  const geoClause = { medium: 'audio', geofence: 'cottage' };

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
      type: 'audio_received',
      message: { from: 'Gabe', to: 'Cat', medium: 'audio' },
      location: { latitude: 37.75827, longitude: -122.41168, accuracy: 5 }
    };

    const res = audio_received.matchEvent(geoClause, event, geoActionContext);

    assert.strictEqual(res, true);
  });

  it('does not fire on message outside geofence', () => {
    const event = {
      type: 'audio_received',
      message: { from: 'Gabe', to: 'Cat', medium: 'audio' },
      location: { latitude: 37.75901, longitude: -122.41149, accuracy: 5 }
    };

    const res = audio_received.matchEvent(geoClause, event, geoActionContext);

    assert.strictEqual(res, false);
  });
});
