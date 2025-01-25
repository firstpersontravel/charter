import React, { Component } from 'react';
import PropTypes from 'prop-types';

import CustomCss from '../partials/custom-css';

export default class App extends Component {
  componentDidMount() {
    this.props.refreshData(this.props.match.params.playerId);
  }

  render() {
    if (!this.props.trip) {
      return <div>Loading</div>;
    }
    const tripId = this.props.match.params.tripId;
    const playerId = this.props.match.params.playerId;
    console.log(`trip ${tripId} player ${playerId}`);
    return (
      <div className="trip-container">
        <CustomCss iface={this.props.iface} />
        App test test
      </div>
    );
  }
}

App.propTypes = {
  match: PropTypes.object.isRequired,
  trip: PropTypes.object,
  iface: PropTypes.object,
  refreshData: PropTypes.func.isRequired
};

App.defaultProps = {
  trip: null,
  iface: null
};
