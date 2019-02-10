const _ = require('lodash');
const moment = require('moment');

const models = require('../../src/models');
const { assertValidation } = require('./utils');

function createMediaAsset(medium, path) {
  return models.Asset.build({
    orgId: 100,
    experienceId: 2,
    type: 'media',
    name: 'test',
    data: {
      medium: medium,
      path: path,
      url: `https://aws.com/${path}`
    },
    createdAt: moment.utc(),
    updatedAt: moment.utc()
  });
}

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
      type: 'must be one of directions, media'
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

    it('forbids extra data property', async () => {
      directionsAsset.data = _.assign(directionsAsset.data, { extra: 'hi' });
      await assertValidation(directionsAsset, {
        directions: 'data additionalProperty "extra" exists in instance when not allowed'
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

  describe('media', () => {
    it('validates with correct extension', async () => {
      await createMediaAsset('audio', 'a/b/c.mp3').validate();
      await createMediaAsset('video', 'a/b/c.MP4').validate();
      await createMediaAsset('image', 'a/b/c.jpEg').validate();
    });

    it('requires valid medium', async () => {
      const mediaAsset = createMediaAsset('audio', 'a.mp3');
      mediaAsset.data = { path: 'a.mp3', url: 'test', medium: 'argh' };
      await assertValidation(mediaAsset, {
        media: 'data.medium is not one of enum values: audio,video,image'
      });      
    });

    it('requires path', async () => {
      const mediaAsset = createMediaAsset('audio', 'a/b/c.mp3');
      mediaAsset.data = { path: null, url: 'test', medium: 'audio' };
      await assertValidation(mediaAsset, {
        media: 'data.path is not of a type(s) string'
      });
    });

    it('requires url', async () => {
      const mediaAsset = createMediaAsset('video', 'a/b/c.mp4');
      mediaAsset.data = { path: 'abc.mp4', url: null, medium: 'video' };
      await assertValidation(mediaAsset, {
        media: 'data.url is not of a type(s) string'
      });
    });

    it('disallows incorrect extension', async () => {
      await assertValidation(createMediaAsset('audio', 'a/b/c.mp4'), {
        media: 'data.path for audio must have one of the following extensions: mp3, m4a'
      });
      await assertValidation(createMediaAsset('video', 'a/b/c.abc'), {
        media: 'data.path for video must have one of the following extensions: mp4'
      });
      await assertValidation(createMediaAsset('image', 'a/b/c.mp4'), {
        media: 'data.path for image must have one of the following extensions: jpg, jpeg, png'
      });
    });
  });
});
