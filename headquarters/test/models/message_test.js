const models = require('../../src/models');
const { assertValidation } = require('./utils');

describe('Message', () => {
  let message;

  beforeEach(() => {
    message = models.Message.build({
      orgId: 100,
      tripId: 1,
      fromRoleName: 'Gabe',
      toRoleName: 'Cat',
      createdAt: '2018-10-04T03:03:03Z',
      name: '',
      medium: 'text',
      content: 'hello there'
    });
  });

  it('validates with all fields present', async () => {
    await message.validate();
  });

  it('requires an org', async () => {
    message.orgId = null;
    await assertValidation(message, { orgId: 'must be present' });
  });

  it('requires a trip', async () => {
    message.tripId = null;
    await assertValidation(message, { tripId: 'must be present' });
  });

  it('requires a sender', async () => {
    message.fromRoleName = null;
    await assertValidation(message, { fromRoleName: 'must be present' });
  });

  it('requires a recipient', async () => {
    message.toRoleName = null;
    await assertValidation(message, { toRoleName: 'must be present' });
  });

  it('requires a created date', async () => {
    message.createdAt = null;
    await assertValidation(message, { createdAt: 'must be present' });
  });

  it('requires a type', async () => {
    message.medium = null;
    await assertValidation(message, { medium: 'must be present' });
  });

  it('requires a valid type', async () => {
    message.medium = '3d';
    await assertValidation(message, {
      medium: 'must be one of text, image, audio, video'
    });
  });

  it('requires content', async () => {
    message.content = null;
    await assertValidation(message, { content: 'must be present' });
  });

  it('requires non-empty content', async () => {
    message.content = '';
    await assertValidation(message, { content: 'must be present' });
  });

  it('allows location', async () => {
    message.sentFromLatitude = 40.213;
    message.sentFromLongitude = 28.213;
    message.sentFromAccuracy = 30;
    await message.validate();
  });

  it('disallows invalid location', async () => {
    message.sentFromLatitude = 'abc';
    message.sentFromAccuracy = false;
    await assertValidation(message, {
      sentFromLatitude: 'must be a valid number',
      sentFromAccuracy: 'must be a valid number'
    });
  });
});
