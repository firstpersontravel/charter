const assert = require('assert');
const sinon = require('sinon');

const Events = require('../src/events');

var sandbox = sinon.sandbox.create();

describe('Events', () => {

  afterEach(() => {
    sandbox.restore();
  });

  describe('#scene_started', () => {

    it('fires on matching scene', () => {
      const event = { type: 'scene_started', scene: 'abc' };
      const res = Events.scene_started.matchEvent({}, 'abc', event);
      assert.strictEqual(res, true);
    });

    it('does not fire on unmatched scene', () => {
      const event = { type: 'scene_started', scene: 'def' };
      const res = Events.scene_started.matchEvent({}, 'abc', event);
      assert.strictEqual(res, false);
    });

  });

  describe('#cue_signaled', () => {

    it('fires on matching cue', () => {
      const event = { type: 'cue_signaled', cue: 'abc' };
      const res = Events.cue_signaled.matchEvent({}, 'abc', event);
      assert.strictEqual(res, true);
    });

    it('does not fire on unmatched cue', () => {
      const event = { type: 'cue_signaled', cue_signaled: 'def' };
      const res = Events.cue_signaled.matchEvent({}, 'abc', event);
      assert.strictEqual(res, false);
    });

  });

  describe('#message_sent', () => {

    const imageClause = { from: 'Gabe', to: 'Cat', type: 'image' };

    it('fires on matching message', () => {
      const event = {
        type: 'message_sent',
        message: { from: 'Gabe', to: 'Cat', type: 'image' }
      };
      const res = Events.message_sent.matchEvent({}, imageClause, event);
      assert.strictEqual(res, true);
    });

    it('does not fire on unmatching message', () => {
      const event = {
        type: 'message_sent',
        message: { from: 'Cat', to: 'Gabe', type: 'image' }
      };
      const res = Events.message_sent.matchEvent({}, imageClause, event);
      assert.strictEqual(res, false);
    });

    const textClause = { type: 'text', contains: 'says' };

    it('fires on message containing text', () => {
      const event = {
        type: 'message_sent',
        message: { type: 'text', content: 'Gabe says hi' }
      };
      const res = Events.message_sent.matchEvent({}, textClause, event);
      assert.strictEqual(res, true);
    });

    it('does not fire on message not containing text', () => {
      const event = {
        type: 'message_sent',
        message: { type: 'text', content: 'Bob sez hi' }
      };
      const res = Events.message_sent.matchEvent({}, textClause, event);
      assert.strictEqual(res, false);
    });

    const geoClause = { type: 'image', geofence: 'cottage' };

    const geoScript = {
      content: {
        geofences: [{ name: 'cottage', center: 'cottage', distance: 50 }],
        waypoints: [{ name: 'cottage', coords: [37.758273, -122.411681] }]
      }
    };

    it('fires on message inside geofence', () => {
      const event = {
        type: 'message_sent',
        message: { from: 'Gabe', to: 'Cat', type: 'image' },
        location: { latitude: 37.75827, longitude: -122.41168, accuracy: 5 }
      };
      const res = Events.message_sent.matchEvent(geoScript, geoClause, event);
      assert.strictEqual(res, true);
    });

    it('does not fire on message outside geofence', () => {
      const event = {
        type: 'message_sent',
        message: { from: 'Gabe', to: 'Cat', type: 'image' },
        location: { latitude: 37.75901, longitude: -122.41149, accuracy: 5 }
      };
      const res = Events.message_sent.matchEvent(geoScript, geoClause, event);
      assert.strictEqual(res, false);
    });
  });

  describe('#geofence_entered', () => {

    it('fires on matching geofence', () => {
      const geoClause = { geofence: 'fence', role: 'Phone' };
      const event = { type: 'geofence', role: 'Phone', geofence: 'fence' };
      const res = Events.geofence_entered.matchEvent({}, geoClause, event);
      assert.strictEqual(res, true);
    });

    it('does not fire on unmatched geofence', () => {
      const geoClause = { geofence: 'fence-2', role: 'Phone' };
      const event = { type: 'geofence', role: 'Phone', geofence: 'fence' };
      const res = Events.geofence_entered.matchEvent({}, geoClause, event);
      assert.strictEqual(res, false);
    });
  });

  describe('#call_ended', () => {
    it('fires on matching call ended', () => {
      const callClause = { role: 'King' };
      const event = { type: 'call_ended', roles: ['King', 'Queen'] };
      const res = Events.call_ended.matchEvent({}, callClause, event);
      assert.strictEqual(res, true);
    });

    it('does not fire on unmatched call', () => {
      const callClause = { role: 'Jack' };
      const event = { type: 'call_ended', roles: ['King', 'Queen'] };
      const res = Events.call_ended.matchEvent({}, callClause, event);
      assert.strictEqual(res, false);
    });
  });

  describe('#call_received', () => {
    it('fires on matching call', () => {
      const callClause = { from: 'Bob', to: 'Jim' };
      const event = { type: 'call_received', from: 'Bob', to: 'Jim' };
      const res = Events.call_received.matchEvent({}, callClause, event);
      assert.strictEqual(res, true);
    });

    it('does not fire on unmatched call', () => {
      const callClause = { from: 'Bob', to: 'Gale' };
      const event = { type: 'call_received', from: 'Bob', to: 'Jim' };
      const res = Events.call_received.matchEvent({}, callClause, event);
      assert.strictEqual(res, false);
    });
  });

  describe('#call_answered', () => {
    it('fires on matching call', () => {
      const callClause = { from: 'Bob', to: 'Jim' };
      const event = { type: 'call_answered', from: 'Bob', to: 'Jim' };
      const res = Events.call_answered.matchEvent({}, callClause, event);
      assert.strictEqual(res, true);
    });

    it('does not fire on unmatched call', () => {
      const callClause = { from: 'Bob', to: 'Gale' };
      const event = { type: 'call_answered', from: 'Bob', to: 'Jim' };
      const res = Events.call_answered.matchEvent({}, callClause, event);
      assert.strictEqual(res, false);
    });
  });

  describe('#query_responded', () => {
    it('fires on matching response', () => {
      const callClause = { query: 'CLIP-INTRO' };
      const event = {
        type: 'query_responded',
        query: 'CLIP-INTRO',
        partial: false
      };
      const res = Events.query_responded.matchEvent({}, callClause, event);
      assert.strictEqual(res, true);
    });

    it('does not fire on unmatched response', () => {
      const callClause = { query: 'CLIP-INTRO' };
      const event = {
        type: 'query_responded',
        query: 'CLIP-OUTRO',
        partial: false
      };
      const res = Events.query_responded.matchEvent({}, callClause, event);
      assert.strictEqual(res, false);
    });

    it('does not fire on partial if waiting for final', () => {
      const callClause = { query: 'CLIP-INTRO', final: true };
      const event = {
        type: 'query_responded',
        query: 'CLIP-INTRO',
        partial: true
      };
      const res = Events.query_responded.matchEvent({}, callClause, event);
      assert.strictEqual(res, false);
    });

    it('does not fire on final if specifies partial', () => {
      const callClause = { query: 'CLIP-INTRO', partial: true };
      const event = {
        type: 'query_responded',
        query: 'CLIP-INTRO',
        partial: false
      };
      const res = Events.query_responded.matchEvent({}, callClause, event);
      assert.strictEqual(res, false);
    });
  });
});
