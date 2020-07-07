const ACTION_FIELDS = {
  play_audio: 'path',
  send_audio: 'content',
  send_image: 'content'
};

const ACTION_NEW_FIELDS = {
  play_audio: 'audio',
  send_audio: 'audio',
  send_image: 'image'
};

const PANEL_FIELDS = {
  audio_foreground: 'path',
  image: 'path',
  video: 'path'
};

const PANEL_NEW_FIELDS = {
  audio_foreground: 'audio',
  image: 'image',
  video: 'video'
};

function getUrlFromAssets(assets, val) {
  if (val.startsWith('https://') ||
      val.startsWith('http://') ||
      val.startsWith('{{')) {
    return val;
  }
  if (!assets) {
    throw new Error('No assets provided.');
  }
  const asset = assets.find(a => a.type === 'media' && a.data.path === val);
  if (!asset) {
    console.error(`! Could not find media asset for ${val}.`);
    return null;
  }
  if (!asset.data.url) {
    throw new Error(`Asset ${asset.id} has no url.`);
  }
  return asset.data.url;
}

module.exports = {
  migrations: {
    actions: function(action, scriptContent, resource, assets) {
      if (!ACTION_FIELDS[action.name]) {
        return;
      }
      const key = ACTION_FIELDS[action.name];
      const val = action[key];
      delete action[key];
      if (val) {
        const url = getUrlFromAssets(assets, val);
        if (url) {
          action[ACTION_NEW_FIELDS[action.name]] = url;
        }
      }
    },
    panels: function(panel, scriptContent, resource, assets) {
      if (!PANEL_FIELDS[panel.type]) {
        return;
      }
      const key = PANEL_FIELDS[panel.type];
      const val = panel[key];
      delete panel[key];
      if (val) {
        const url = getUrlFromAssets(assets, val);
        if (url) {
          panel[PANEL_NEW_FIELDS[panel.type]] = url;
        }
      }
    },
    clips: function(clip, scriptContent, assets) {
      const val = clip.path;
      delete clip.path;
      if (val) {
        const url = getUrlFromAssets(assets, val);
        if (url) {
          clip.audio = url;
        } else if (!clip.transcript) {
          clip.transcript = 'This clip is empty.';
        }
      }
    },
  },
  tests: [{
    assets: [
      { type: 'media', data: { path: 'a.mp3', url: 'http://server/a.mp3' } },
      { type: 'media', data: { path: 'c.jpg', url: 'https://host/c.jpg' } },
      { type: 'media', data: { path: 'd.m4a', url: 'http://host/path/d.m4a' } }
    ],
    before: {
      triggers: [{
        actions: [
          { name: 'play_audio', path: 'a.mp3' },
          { name: 'send_audio', content: 'a.mp3' },
          { name: 'send_image', content: 'c.jpg' }
        ]
      }],
      pages: [{
        panels: [
          { type: 'image', path: 'c.jpg' },
          { type: 'audio_foreground', path: 'd.m4a' },
          { type: 'video', path: 'c.jpg' }
        ]
      }],
      clips: [
        { path: 'd.m4a' },
        { transcript: 'hi' },
        { path: 'invalid' }
      ]
    },
    after: {
      triggers: [{
        actions: [
          { name: 'play_audio', audio: 'http://server/a.mp3' },
          { name: 'send_audio', audio: 'http://server/a.mp3' },
          { name: 'send_image', image: 'https://host/c.jpg' }
        ]
      }],
      pages: [{
        panels: [
          { type: 'image', image: 'https://host/c.jpg' },
          { type: 'audio_foreground', audio: 'http://host/path/d.m4a' },
          { type: 'video', video: 'https://host/c.jpg' }
        ]
      }],
      clips: [
        { audio: 'http://host/path/d.m4a' },
        { transcript: 'hi' },
        { transcript: 'This clip is empty.' },
      ]
    }
  }]
};
