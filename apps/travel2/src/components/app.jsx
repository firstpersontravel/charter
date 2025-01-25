import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class App extends Component {
  componentDidMount() {
    const tripId = this.props.match.params.tripId;
    const playerId = this.props.match.params.playerId;
    console.log(`trip ${tripId} player ${playerId}`);

    this.props.refreshData(this.props.match.params.playerId);
  }

  render() {
    const tripId = this.props.match.params.tripId;
    const playerId = this.props.match.params.playerId;
    console.log(`trip ${tripId} player ${playerId}`);
    return (
      <div>
        App
      </div>
    );
  }
}

App.propTypes = {
  match: PropTypes.object.isRequired,
  refreshData: PropTypes.func.isRequired
};
