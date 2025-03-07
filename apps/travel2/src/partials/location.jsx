import React from 'react';
import PropTypes from 'prop-types';

const MIN_FIX_FREQUENCY = 30000;


export default class LocationTracker extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      watchId: null,
      lastFix: null,
      lastError: null
    };

    // throttle out updates more frequent than every 30 secs
    this.interval = null;
    this.startCallback = null;

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

  getErrorTitle() {
    const { lastError } = this.state;
    if (!lastError) return null;

    switch (lastError.code) {
      case 'NO_GEOLOCATION':
        return 'Location not supported';
      case 1: // PERMISSION_DENIED
        return 'Location permission denied';
      case 2: // POSITION_UNAVAILABLE
        return 'Location unavailable';
      case 3: // TIMEOUT
        return 'Location request timeout';
      default:
        return 'Unknown error';
    }
  }


  handleFix(position, force = false) {
    const thisFix = new Date();
    if (this.state.lastFix && thisFix - this.state.lastFix < MIN_FIX_FREQUENCY && !force) {
      // ignore fix if more frequent
      return;
    }

    this.state.lastFix = new Date();
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
      watchId: null
    });
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

    this.setState({ watchId });

    // Start watching again on focus, and every minute
    this.startCallback = () => this.startWatching();
    window.addEventListener('focus', this.startCallback);
    this.interval = setInterval(this.startCallback, 60000);
  }

  stopWatching() {
    if (!this.state.watchId) return;

    navigator.geolocation.clearWatch(this.state.watchId);
    clearInterval(this.interval);
    window.removeEventListener('focus', this.startCallback);

    this.startCallback = null;
    this.interval = null;

    this.setState({ watchId: null });
  }

  render() {
    // This component doesn't render anything visible
    return null;
  }
}

LocationTracker.propTypes = {
  updateLocation: PropTypes.func.isRequired
};
