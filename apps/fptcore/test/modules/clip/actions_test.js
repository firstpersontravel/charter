const assert = require('assert');
const moment = require('moment');

const clipActions = require('../../../src/modules/clip/actions');

describe('#play_clip', () => {
  it('does nothing if cannot find clip', () => {
    const script = { content: {} };
    const params = { clip_name: 'CLIP-TEST' };
    const res = clipActions.play_clip.applyAction(
      script, {}, params, moment.utc());
    assert.deepEqual(res, null);
  });

  it('plays audio clip if found', () => {
    const script = {
      content: {
        clips: [{
          name: 'CLIP-TEST',
          path: 'audio.mp3'
        }]
      }
    };
    const params = { clip_name: 'CLIP-TEST' };
    const res = clipActions.play_clip.applyAction(
      script, {}, params, moment.utc());
    assert.deepEqual(res, [
      { operation: 'twiml', clause: 'play', media: 'audio.mp3' }
    ]);
  });

  it('plays clip with no audio if found', () => {
    const script = {
      content: {
        clips: [{
          name: 'CLIP-TEST',
          transcript: 'Why hello there'
        }]
      }
    };
    const params = { clip_name: 'CLIP-TEST' };
    const res = clipActions.play_clip.applyAction(
      script, {}, params, moment.utc());
    assert.deepEqual(res, [{
      operation: 'twiml',
      clause: 'say',
      message: 'Why hello there',
      voice: 'alice'
    }]);
  });

  it('plays audio clip with response', () => {
    const script = {
      content: {
        clips: [{
          name: 'CLIP-TEST',
          path: 'audio.mp3',
          query: {
            name: 'QUERY-TEST',
            hints: ['yes', 'no']
          }
        }]
      }
    };
    const params = { clip_name: 'CLIP-TEST' };
    const res = clipActions.play_clip.applyAction(
      script, {}, params, moment.utc());
    assert.deepEqual(res, [{
      operation: 'twiml',
      clause: 'gather',
      queryName: 'QUERY-TEST',
      queryType: 'normal',
      queryHints: ['yes', 'no'],
      subclause: {
        clause: 'play',
        media: 'audio.mp3'
      }
    }]);
  });

  it('says transcript with response', () => {
    const script = {
      content: {
        clips: [{
          name: 'CLIP-TEST',
          transcript: 'Why hello there',
          query: {
            name: 'QUERY-TEST',
            type: 'phone',
            hints: ['yes', 'no']
          }
        }]
      }
    };
    const params = { clip_name: 'CLIP-TEST' };
    const res = clipActions.play_clip.applyAction(
      script, {}, params, moment.utc());
    assert.deepEqual(res, [{
      operation: 'twiml',
      clause: 'gather',
      queryName: 'QUERY-TEST',
      queryType: 'phone',
      queryHints: ['yes', 'no'],
      subclause: {
        clause: 'say',
        message: 'Why hello there',
        voice: 'alice'
      }
    }]);
  });
});
