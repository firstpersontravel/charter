const _ = require('lodash');
const moment = require('moment');

const models = require('../../src/models');
const { assertValidation } = require('./utils');

describe('Asset', () => {

  it('prohibits invalid type', async () => {
    const invalidAsset = models.Asset.build({
      orgId: 100,
      experienceId: 2,
      type: 'invalid',
      name: 'something',
      data: {},
      createdAt: moment.utc(),
      updatedAt: moment.utc()
    });
    await assertValidation(invalidAsset, {
      type: 'must be one of directions'
    });
  });

  describe('directions', () => {
    let directionsAsset;

    beforeEach(() => {
      directionsAsset = models.Asset.build({
        orgId: 100,
        experienceId: 2,
        type: 'directions',
        name: 'dir',
        data: {
          route: 'route',
          from_option: 'opt1',
          to_option: 'opt2',
          start: [37.775146, -122.421052],
          end: [37.775146, -122.421052],
          steps: [{
            start: [37.775146, -122.421052],
            instructions: 'go here',
            distance: '2m'
          }],
          polyline: 'encoded'
        },
        createdAt: moment.utc(),
        updatedAt: moment.utc()
      });
    });

    it('validates with all fields present', async () => {
      await directionsAsset.validate();
    });

    it('requires an org', async () => {
      directionsAsset.orgId = null;
      await assertValidation(directionsAsset, { orgId: 'must be present' });
    });

    it('requires an experience', async () => {
      directionsAsset.experienceId = null;
      await assertValidation(directionsAsset,
        { experienceId: 'must be present' });
    });

    it('requires a name', async () => {
      directionsAsset.name = '';
      await assertValidation(directionsAsset, { name: 'must be present' });
    });

    it('requires route', async () => {
      directionsAsset.data = _.assign(directionsAsset.data, { route: '' });
      await assertValidation(directionsAsset, {
        directions: 'data.route does not meet minimum length of 1'
      });
    });

    it('requires polyline', async () => {
      directionsAsset.data = _.assign(directionsAsset.data, { polyline: undefined });
      await assertValidation(directionsAsset, {
        directions: 'data requires property "polyline"'
      });
    });

    it('requires steps', async () => {
      directionsAsset.data = _.assign(directionsAsset.data, { steps: [] });
      await assertValidation(directionsAsset, {
        directions: 'data.steps does not meet minimum length of 1'
      });
    });
  });
});
