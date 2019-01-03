const _ = require('lodash');
const moment = require('moment');

const models = require('../../src/models');
const { assertValidation } = require('./utils');

describe('Action', () => {
  let action;

  beforeEach(() => {
    action = models.Action.build({
      orgId: 100,
      tripId: 2,
      type: 'action',
      name: 'set_value',
      params: {},
      createdAt: moment.utc(),
      scheduledAt: moment.utc()
    });
  });

  it('validates with all fields present', async () => {
    await action.validate();
  });

  it('requires an org', async () => {
    action.orgId = null;
    await assertValidation(action, { orgId: 'must be present' });
  });

  it('requires a trip', async () => {
    action.tripId = null;
    await assertValidation(action, { tripId: 'must be present' });
  });

  it('requires a name', async () => {
    action.name = '';
    await assertValidation(action, { name: 'must be present' });
  });

  it('allows valid trigger name', async () => {
    action.triggerName = 'trigger';
    await action.validate();
  });

  it('must have trigger name < 64 chars', async () => {
    action.triggerName = _.range(300).join('');
    await assertValidation(action, {
      triggerName: 'must be less than 64 characters'
    });
  });

  it('must have a valid date for createdAt', async () => {
    action.createdAt = 'bad string';
    await assertValidation(action, {
      createdAt: 'Validation isDate on createdAt failed'
    });
  });

  it('must have a valid date for scheduledAt', async () => {
    action.scheduledAt = false;
    await assertValidation(action, {
      scheduledAt: 'Validation isDate on scheduledAt failed'
    });
  });

  it('allows params', async () => {
    action.params = { option: 'true', another: 123 };
    await action.validate();
  });

  it('allows event', async () => {
    action.event = { type: 'cue', arg: false };
    await action.validate();
  });
});
