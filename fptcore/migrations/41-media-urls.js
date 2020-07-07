const ACTION_FIELDS = {
  play_audio: 'path',
  send_audio: 'content',
  send_image: 'content'
};

const PANEL_FIELDS = {
  audio_foreground: 'path',
  image: 'path',
  video: 'path'
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
      if (!action[key]) {
        return;
      }
      const url = getUrlFromAssets(assets, action[key]);
      if (url) {
        action[key] = url;
      } else {
        delete action[key];
      }
    },
    panels: function(panel, scriptContent, resource, assets) {
      if (!PANEL_FIELDS[panel.type]) {
        return;
      }
      const key = PANEL_FIELDS[panel.type];
      if (!panel[key]) {
        return;
      }
      const url = getUrlFromAssets(assets, panel[key]);
      if (url) {
        panel[key] = url;
      } else {
        delete panel[key];
      }
    },
    clips: function(clip, scriptContent, assets) {
      if (!clip.path) {
        return;
      }
      const url = getUrlFromAssets(assets, clip.path);
      if (url) {
        clip.path = url;
      } else {
        delete clip.path;
        if (!clip.transcript) {
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
        actions: [{ name: 'play_audio', path: 'a.mp3' }]
      }],
      pages: [{
        panels: [{ type: 'image', path: 'c.jpg' }]
      }],
      clips: [
        { path: 'd.m4a' },
        { transcript: 'hi' },
        { path: '' }
      ]
    },
    after: {
      triggers: [{
        actions: [{ name: 'play_audio', path: 'http://server/a.mp3' }]
      }],
      pages: [{
        panels: [{ type: 'image', path: 'https://host/c.jpg' }]
      }],
      clips: [
        { path: 'http://host/path/d.m4a' },
        { transcript: 'hi' },
        { transcript: 'This clip is empty.' },
      ]
    }
  }]
};
