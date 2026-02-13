const assert = require('assert');

const audio_received = require('../../../src/modules/messages/audio_received').default;

describe('#audio_received', () => {
  const audioClause = { from: 'Gabe', to: 'Cat', medium: 'audio' };

  it('fires on matching message', () => {
    const event = { type: 'audio_received', from: 'Gabe', to: 'Cat' };

    const res = audio_received.matchEvent(audioClause, event, {});

    assert.strictEqual(res, true);
  });

  it('does not fire on unmatching message', () => {
    const event = { type: 'audio_received', from: 'Cat', to: 'Gabe' };

    const res = audio_received.matchEvent(audioClause, event, {});

    assert.strictEqual(res, false);
  });
});
