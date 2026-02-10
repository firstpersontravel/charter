const assert = require('assert');

const image_received = require('../../../src/modules/messages/image_received');

describe('#image_received', () => {
  const imageClause = { from: 'Gabe', to: 'Cat', medium: 'image' };

  it('fires on matching message', () => {
    const event = { type: 'image_received', from: 'Gabe', to: 'Cat' };

    const res = image_received.matchEvent(imageClause, event, {});

    assert.strictEqual(res, true);
  });

  it('does not fire on unmatching message', () => {
    const event = { type: 'image_received', from: 'Cat', to: 'Gabe' };

    const res = image_received.matchEvent(imageClause, event, {});

    assert.strictEqual(res, false);
  });
});
