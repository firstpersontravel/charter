import Ember from 'ember';

function adjustColorBrightness(col, amt) {
  col = col.slice(1);
  var num = parseInt(col,16);
  var r = (num >> 16) + amt;
  if (r > 255) { r = 255; }
  else if (r < 0) { r = 0; }
  var b = ((num >> 8) & 0x00FF) + amt;
  if (b > 255) { b = 255; }
  else if (b < 0) { b = 0; }
  var g = (num & 0x0000FF) + amt;
  if (g > 255) { g = 255; }
  else if (g < 0) { g = 0; }
  return "#" + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
}

// https://stackoverflow.com/questions/12043187/how-to-check-if-hex-color-is-too-black
function lumaForColor(col) {
  var c = col.slice(1);      // strip #
  var rgb = parseInt(c, 16);   // convert rrggbb to decimal
  var r = (rgb >> 16) & 0xff;  // extract red
  var g = (rgb >>  8) & 0xff;  // extract green
  var b = (rgb >>  0) & 0xff;  // extract blue
  
  var luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709
  return luma;  
}

function chooseTextColor(bgCol) {
  const bgLuma = lumaForColor(bgCol);
  return bgLuma < 150 ? '#ffffff' : '#000000';
}

export default Ember.Controller.extend({
  environment: Ember.inject.service(),
  location: Ember.inject.service(),
  audio: Ember.inject.service(),
  application: Ember.inject.controller(),

  interface: function() {
    const script = this.get('model.trip.script');
    const interfaceName = this.get('model.role.interface');
    const iface = (script.get('content.interfaces') || [])
      .find(i => i.name === interfaceName);
    return iface;
  }.property('model.role.interface'),

  colors: function() {
    const bgColor = this.get('interface.background_color') || '#ffffff';
    const headerColor = this.get('interface.header_color') || '#aaaaaa';
    const accentColor = this.get('interface.accent_color') || '#888888';
    const primaryColor = this.get('interface.primary_color') || '#bb0000';
    return {
      bg: bgColor,
      bgDark: adjustColorBrightness(bgColor, -10),
      bgDarker: adjustColorBrightness(bgColor, -30),
      bgText: chooseTextColor(bgColor),
      header: headerColor,
      headerDark: adjustColorBrightness(headerColor, -10),
      headerDarker: adjustColorBrightness(headerColor, -30),
      headerText: chooseTextColor(headerColor),
      accent: accentColor,
      accentDarker: adjustColorBrightness(accentColor, -30),
      accentText: chooseTextColor(accentColor),
      primary: primaryColor,
      primaryText: chooseTextColor(primaryColor)
    };
  }.property('interface'),
  
  customCss: function() {
    return this.get('interface.custom_css');
  }.property('interface'),

  fontFamily: function() {
    return this.get('interface.font_family') || 'Raleway';
  }.property('interface'),

  lastFixDidChange: function() {
    var lastFix = this.get('location.lastFix');
    if (!lastFix || !lastFix.timestamp || !lastFix.coords) { return; }
    var player = this.get('model');
    var lastFixAt = moment.utc(lastFix.timestamp);
    var currentFixAt = player.get('participant.locationTimestamp');
    if (lastFixAt < currentFixAt) { return; }
    this.send('updateLocation', lastFix);
  }.observes('location.lastFix').on('init'),

  currentPageDidChange: function() {
    if (this.get('application.noack')) {
      return;
    }
    Ember.run.next(() => {
      this.send('acknowledgePage', this.get('model.currentPageName'));
    });
  }.observes('model.currentPageName'),

  updateAudioState: function() {
    var audioState = this.get('model.values.audio');
    var muted = this.get('application.mute');

    // Check if unchanged.
    if (audioState === this._lastAudioState && muted === this._lastMuted) {
      return;
    }
    this._lastAudioState = audioState;
    this._lastMuted = muted;

    if (muted || !audioState || !audioState.is_playing || !audioState.path) {
      this.get('audio').fadeOut();
      return;
    }
    var startedAt = audioState.started_at;
    var startedTime = audioState.started_time;
    var elapsedMsec = moment.utc().diff(startedAt);
    var currentTime = startedTime + elapsedMsec / 1000.0;
    var script = this.get('model.trip.script');
    var path = script.urlForContentPath(audioState.path);
    this.get('audio').play(path, currentTime);
  },

  actions: {
    mute: function() {
      this.get('application').toggleProperty('mute');
      this.updateAudioState();
    }
  }
});
