const assert = require('assert');

const text_received = require('../../../src/modules/messages/text_received');

describe('#text_received', () => {
  const imageClause = { from: 'Gabe', to: 'Cat', medium: 'text' };

  it('fires on matching message', () => {
    const event = { type: 'text_received', from: 'Gabe', to: 'Cat' };

    const res = text_received.matchEvent(imageClause, event, {});

    assert.strictEqual(res, true);
  });

  it('does not fire on unmatching message', () => {
    const event = { type: 'text_received', from: 'Cat', to: 'Gabe' };

    const res = text_received.matchEvent(imageClause, event, {});

    assert.strictEqual(res, false);
  });
});
