const _ = require('lodash');
const moment = require('moment');

const models = require('../../src/models');
const { assertValidation } = require('./utils');

function createMediaAsset(type, path) {
  return models.Asset.build({
    orgId: 100,
    experienceId: 2,
    type: type,
    name: 'test',
    data: {
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
      type: 'must be one of directions, audio, video, image'
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

  describe('audio', () => {
    it('validates with all fields present', async () => {
      await createMediaAsset('audio', 'a/b/c.mp3').validate();
    });

    it('requires path', async () => {
      const audioAsset = createMediaAsset('audio', 'a/b/c.mp4');
      audioAsset.data = { path: null, url: 'test' };
      await assertValidation(audioAsset, {
        audio: 'data.path is not of a type(s) string'
      });
    });

    it('requires url', async () => {
      const audioAsset = createMediaAsset('audio', 'a/b/c.mp4');
      audioAsset.data = { path: 'abc.mp3', url: null };
      await assertValidation(audioAsset, {
        audio: 'data.url is not of a type(s) string'
      });
    });

    it('disallows mp4', async () => {
      const audioAsset = createMediaAsset('audio', 'a/b/c.mp4');
      await assertValidation(audioAsset, {
        audio: 'data.path does not match pattern "\\\\.(mp3|m4a)$"'
      });
    });
  });

  describe('video', () => {
    it('validates with all fields present', async () => {
      await createMediaAsset('video', 'a/b/c.mp4').validate();
    });

    it('requires path', async () => {
      const videoAsset = createMediaAsset('video', 'a/b/c.mp4');
      videoAsset.data = { path: null, url: 'test' };
      await assertValidation(videoAsset, {
        video: 'data.path is not of a type(s) string'
      });
    });

    it('requires url', async () => {
      const videoAsset = createMediaAsset('video', 'a/b/c.mp4');
      videoAsset.data = { path: 'abc.mp4', url: null };
      await assertValidation(videoAsset, {
        video: 'data.url is not of a type(s) string'
      });
    });

    it('disallows png', async () => {
      const videoAsset = createMediaAsset('video', 'a/b/c.png');
      await assertValidation(videoAsset, {
        video: 'data.path does not match pattern "\\\\.(mp4)$"'
      });
    });
  });

  describe('image', () => {
    it('validates with all fields present', async () => {
      await createMediaAsset('image', 'a/b/c.png').validate();
      await createMediaAsset('image', 'a/b/c.jpg').validate();
    });

    it('requires path', async () => {
      const imageAsset = createMediaAsset('image', 'a/b/c.png');
      imageAsset.data = { path: null, url: 'test' };
      await assertValidation(imageAsset, {
        image: 'data.path is not of a type(s) string'
      });
    });

    it('requires url', async () => {
      const imageAsset = createMediaAsset('image', 'a/b/c.png');
      imageAsset.data = { path: 'abc.png', url: null };
      await assertValidation(imageAsset, {
        image: 'data.url is not of a type(s) string'
      });
    });

    it('disallows m4a', async () => {
      const imageAsset = createMediaAsset('image', 'a/b/c.m4a');
      await assertValidation(imageAsset, {
        image: 'data.path does not match pattern "\\\\.(jpg|jpeg|png)$"'
      });
    });
  });
});
