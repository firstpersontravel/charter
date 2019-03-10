const assert = require('assert');

const callActions = require('../../../src/modules/calls/actions');

describe('#add_to_call', () => {
  it('starts a conference from incoming call', () => {
    const params = { role_name: 'Invitee' };
    const actionContext = {
      evalContext: {
        event: { type: 'call_received', from: 'Caller' }
      }
    };

    const res = callActions.add_to_call.applyAction(params, actionContext);

    assert.deepEqual(res, [
      {
        operation: 'twiml',
        clause: 'dial',
        fromRoleName: 'Caller',
        toRoleName: 'Invitee'
      }
    ]);
  });
});

describe('#initiate_call', () => {
  it('starts a conference from incoming call', () => {
    const params = { to_role_name: 'Callee', as_role_name: 'Actor' };
    const actionContext = { evalContext: {} };

    const res = callActions.initiate_call.applyAction(params, actionContext);

    assert.deepEqual(res, [{
      operation: 'initiateCall',
      toRoleName: 'Callee',
      asRoleName: 'Actor',
      detectVoicemail: false
    }]);
  });
});

describe('#play_clip', () => {
  it('does nothing if cannot find clip', () => {
    const params = { clip_name: 'CLIP-TEST' };
    const actionContext = {
      scriptContent: {}
    };

    const res = callActions.play_clip.applyAction(params, actionContext);

    assert.deepEqual(res, null);
  });

  it('plays audio clip if found', () => {
    const params = { clip_name: 'CLIP-TEST' };
    const actionContext = {
      scriptContent: {
        clips: [{
          name: 'CLIP-TEST',
          path: 'audio.mp3'
        }]
      }
    };

    const res = callActions.play_clip.applyAction(params, actionContext);

    assert.deepEqual(res, [
      { operation: 'twiml', clause: 'play', media: 'audio.mp3' }
    ]);
  });

  it('plays clip with no audio if found', () => {
    const params = { clip_name: 'CLIP-TEST' };
    const actionContext = {
      scriptContent: {
        clips: [{
          name: 'CLIP-TEST',
          transcript: 'Why hello there'
        }]
      }
    };

    const res = callActions.play_clip.applyAction(params, actionContext);

    assert.deepEqual(res, [{
      operation: 'twiml',
      clause: 'say',
      message: 'Why hello there',
      voice: 'alice'
    }]);
  });

  it('plays audio clip with response', () => {
    const params = { clip_name: 'CLIP-TEST' };
    const actionContext = {
      scriptContent: {
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
    const res = callActions.play_clip.applyAction(params, actionContext);

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
    const params = { clip_name: 'CLIP-TEST' };
    const actionContext = {
      scriptContent: {
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

    const res = callActions.play_clip.applyAction(params, actionContext);

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
