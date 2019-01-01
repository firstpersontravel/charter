const moment = require('moment');

const models = require('../../src/models');
const { assertValidation } = require('./utils');

describe('Player', () => {
  let player;

  beforeEach(() => {
    player = models.Player.build({
      tripId: 2,
      roleName: 'Role'
    });
  });

  it('validates with all fields present', async () => {
    await player.validate();
  });

  it('requires a trip', async () => {
    player.tripId = null;
    await assertValidation(player, { tripId: 'must be present' });
  });

  it('requires a role', async () => {
    player.roleName = '';
    await assertValidation(player, { roleName: 'must be present' });
  });

  it('allows current page', async () => {
    player.currentPageName = 'PAGE-1';
    await player.validate();
  });

  it('allows acknowledged page', async () => {
    player.acknowledgedPageName = 'PAGE-1';
    player.acknowledgedPageAt = moment.utc();
    await player.validate();
  });
});
