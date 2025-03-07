import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class LocationTracker extends Component {
  constructor(props) {
    super(props);
    this.state = {
      watchId: null,
      lastFix: null,
      lastError: null,
      isWatching: false
    };

    // throttle out updates more frequent than every 30 secs
    this.minFixFrequency = 30000;
    this._lastFix = null;
    this._interval = null;
    this._startCallback = null;

    // Bind methods
    this.handleFix = this.handleFix.bind(this);
    this.handleError = this.handleError.bind(this);
    this.startWatching = this.startWatching.bind(this);
    this.stopWatching = this.stopWatching.bind(this);
  }

  componentDidMount() {
    this.startWatching();
  }

  componentWillUnmount() {
    this.stopWatching();
  }

  handleFix(position, force = false) {
    const thisFix = new Date();
    if (this._lastFix && thisFix - this._lastFix < this.minFixFrequency && !force) {
      // ignore fix if more frequent
      return;
    }
    
    this._lastFix = new Date();
    const fix = {
      coords: position.coords,
      timestamp: position.timestamp
    };
    
    this.setState({ lastFix: fix, lastError: null });
    
    // Call the updateLocation prop with the new location
    if (this.props.updateLocation) {
      this.props.updateLocation(
        position.coords.latitude,
        position.coords.longitude,
        position.coords.accuracy,
        Math.floor(position.timestamp / 1000)
      );
    }
  }

  handleError(error) {
    this.setState({ 
      lastFix: null, 
      lastError: error, 
      watchId: null,
      isWatching: false 
    });
  }

  getErrorTitle() {
    const { lastError } = this.state;
    if (!lastError) return null;
    
    switch (lastError.code) {
      case 'NO_GEOLOCATION':
        return "Location not supported";
      case 1: // PERMISSION_DENIED
        return "Location permission denied";
      case 2: // POSITION_UNAVAILABLE
        return "Location unavailable";
      case 3: // TIMEOUT
        return "Location request timeout";
      default:
        return "Unknown error";
    }
  }

  startWatching() {
    // If we're already watching, clear and restart
    if (this.state.watchId) {
      this.stopWatching();
    }

    if (!navigator.geolocation) {
      this.handleError({ code: 'NO_GEOLOCATION' });
      return;
    }

    const options = { enableHighAccuracy: true, maximumAge: 60 * 1000 };
    const watchId = navigator.geolocation.watchPosition(
      this.handleFix,
      this.handleError,
      options
    );
    
    this.setState({ watchId, isWatching: true });

    // Start watching again on focus, and every minute
    this._startCallback = () => this.startWatching();
    window.addEventListener('focus', this._startCallback);
    this._interval = setInterval(this._startCallback, 60000);
  }

  stopWatching() {
    if (!this.state.watchId) return;
    
    navigator.geolocation.clearWatch(this.state.watchId);
    clearInterval(this._interval);
    window.removeEventListener('focus', this._startCallback);
    
    this._startCallback = null;
    this._interval = null;
    
    this.setState({ watchId: null, isWatching: false });
  }

  render() {
    // This component doesn't render anything visible
    return null;
  }
}

LocationTracker.propTypes = {
  updateLocation: PropTypes.func.isRequired,
};
