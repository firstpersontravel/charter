const models = require('../../src/models');
const { assertValidation } = require('./utils');

describe('Message', () => {
  let message;

  beforeEach(() => {
    message = models.Message.build({
      tripId: 1,
      sentById: 2,
      sentToId: 3,
      createdAt: '2018-10-04T03:03:03Z',
      messageName: '',
      messageType: 'text',
      messageContent: 'hello there'
    });
  });

  it('validates with all fields present', async () => {
    await message.validate();
  });

  it('requires a trip', async () => {
    message.tripId = null;
    await assertValidation(message, { tripId: 'must be present' });
  });

  it('requires a sender', async () => {
    message.sentById = null;
    await assertValidation(message, { sentById: 'must be present' });
  });

  it('requires a recipient', async () => {
    message.sentToId = null;
    await assertValidation(message, { sentToId: 'must be present' });
  });

  it('requires a created date', async () => {
    message.createdAt = null;
    await assertValidation(message, { createdAt: 'must be present' });
  });

  it('requires a type', async () => {
    message.messageType = null;
    await assertValidation(message, { messageType: 'must be present' });
  });

  it('requires a valid type', async () => {
    message.messageType = '3d';
    await assertValidation(message, {
      messageType: 'must be one of text, image, audio, video'
    });
  });

  it('requires content', async () => {
    message.messageContent = null;
    await assertValidation(message, { messageContent: 'must be present' });
  });

  it('requires non-empty content', async () => {
    message.messageContent = '';
    await assertValidation(message, { messageContent: 'must be present' });
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
