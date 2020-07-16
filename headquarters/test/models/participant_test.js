const models = require('../../src/models');
const { assertValidation } = require('./utils');

describe('Participant', () => {
  let participant;

  beforeEach(() => {
    participant = models.Participant.build({
      orgId: 100,
      experienceId: 1,
    });
  });

  it('validates with all required fields present', async () => {
    await participant.validate();
  });

  it('requires an org', async () => {
    participant.orgId = null;
    await assertValidation(participant, { orgId: 'must be present' });
  });

  it('requires an experience', async () => {
    participant.experienceId = null;
    await assertValidation(participant, { experienceId: 'must be present' });
  });

  it('allows names', async () => {
    participant.name = 'Gabe';
    await participant.validate();
  });

  it('requires a boolean isArchived', async () => {
    participant.isArchived = 2;
    await assertValidation(participant, { isArchived: 'must be true or false' });
  });

  it('requires a boolean isActive', async () => {
    participant.isActive = 2;
    await assertValidation(participant, { isActive: 'must be true or false' });
  });
});
