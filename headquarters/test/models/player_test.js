const moment = require('moment-timezone');

const models = require('../../src/models');
const { assertValidation } = require('./utils');

describe('Player', () => {
  let player;

  beforeEach(() => {
    player = models.Player.build({
      createdAt: moment.utc(),
      orgId: 100,
      experienceId: 3,
      tripId: 2,
      roleName: 'Role'
    });
  });

  it('validates with all fields present', async () => {
    await player.validate();
  });

  it('requires an org', async () => {
    player.orgId = null;
    await assertValidation(player, { orgId: 'must be present' });
  });

  it('requires an experience', async () => {
    player.experienceId = null;
    await assertValidation(player, { experienceId: 'must be present' });
  });

  it('requires a trip', async () => {
    player.tripId = null;
    await assertValidation(player, { tripId: 'must be present' });
  });

  it('requires a role', async () => {
    player.roleName = '';
    await assertValidation(player, { roleName: 'must be present' });
  });

  it('allows acknowledged page', async () => {
    player.acknowledgedPageName = 'PAGE-1';
    player.acknowledgedPageAt = moment.utc();
    await player.validate();
  });
});
