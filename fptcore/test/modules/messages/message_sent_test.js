const assert = require('assert');

const message_sent = require('../../../src/modules/messages/message_sent');

describe('#message_sent', () => {
  const imageClause = { from: 'Gabe', to: 'Cat', type: 'image' };

  it('fires on matching message', () => {
    const event = {
      type: 'message_sent',
      message: { from: 'Gabe', to: 'Cat', type: 'image' }
    };

    const res = message_sent.matchEvent(imageClause, event, {});

    assert.strictEqual(res, true);
  });

  it('does not fire on unmatching message', () => {
    const event = {
      type: 'message_sent',
      message: { from: 'Cat', to: 'Gabe', type: 'image' }
    };

    const res = message_sent.matchEvent(imageClause, event, {});

    assert.strictEqual(res, false);
  });

  const textClause = { type: 'text', contains: 'says' };

  it('fires on message containing text', () => {
    const event = {
      type: 'message_sent',
      message: { type: 'text', content: 'Gabe says hi' }
    };

    const res = message_sent.matchEvent(textClause, event, {});

    assert.strictEqual(res, true);
  });

  it('does not fire on message not containing text', () => {
    const event = {
      type: 'message_sent',
      message: { type: 'text', content: 'Bob sez hi' }
    };
    const res = message_sent.matchEvent(textClause, event, {});
    assert.strictEqual(res, false);
  });

  const geoClause = { type: 'image', geofence: 'cottage' };

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
      type: 'message_sent',
      message: { from: 'Gabe', to: 'Cat', type: 'image' },
      location: { latitude: 37.75827, longitude: -122.41168, accuracy: 5 }
    };

    const res = message_sent.matchEvent(geoClause, event, geoActionContext);

    assert.strictEqual(res, true);
  });

  it('does not fire on message outside geofence', () => {
    const event = {
      type: 'message_sent',
      message: { from: 'Gabe', to: 'Cat', type: 'image' },
      location: { latitude: 37.75901, longitude: -122.41149, accuracy: 5 }
    };

    const res = message_sent.matchEvent(geoClause, event, geoActionContext);

    assert.strictEqual(res, false);
  });
});
