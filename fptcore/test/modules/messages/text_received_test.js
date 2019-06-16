const assert = require('assert');

const text_received = require('../../../src/modules/messages/text_received');

describe('#text_received', () => {
  const imageClause = { from: 'Gabe', to: 'Cat', medium: 'text' };

  it('fires on matching message', () => {
    const event = {
      type: 'text_received',
      message: { from: 'Gabe', to: 'Cat', medium: 'text' }
    };

    const res = text_received.matchEvent(imageClause, event, {});

    assert.strictEqual(res, true);
  });

  it('does not fire on unmatching message', () => {
    const event = {
      type: 'text_received',
      message: { from: 'Cat', to: 'Gabe', medium: 'text' }
    };

    const res = text_received.matchEvent(imageClause, event, {});

    assert.strictEqual(res, false);
  });

  const containsClause = { medium: 'text', contains: 'says' };

  it('fires on message containing text', () => {
    const event = {
      type: 'text_received',
      message: { medium: 'text', content: 'Gabe says hi' }
    };

    const res = text_received.matchEvent(containsClause, event, {});

    assert.strictEqual(res, true);
  });

  it('does not fire on message not containing text', () => {
    const event = {
      type: 'text_received',
      message: { medium: 'text', content: 'Bob sez hi' }
    };
    const res = text_received.matchEvent(containsClause, event, {});
    assert.strictEqual(res, false);
  });

  const geoClause = { medium: 'text', geofence: 'cottage' };

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
      type: 'text_received',
      message: { from: 'Gabe', to: 'Cat', medium: 'text' },
      location: { latitude: 37.75827, longitude: -122.41168, accuracy: 5 }
    };

    const res = text_received.matchEvent(geoClause, event, geoActionContext);

    assert.strictEqual(res, true);
  });

  it('does not fire on message outside geofence', () => {
    const event = {
      type: 'text_received',
      message: { from: 'Gabe', to: 'Cat', medium: 'text' },
      location: { latitude: 37.75901, longitude: -122.41149, accuracy: 5 }
    };

    const res = text_received.matchEvent(geoClause, event, geoActionContext);

    assert.strictEqual(res, false);
  });
});
