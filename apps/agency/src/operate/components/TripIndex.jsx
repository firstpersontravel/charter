import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { browserHistory } from 'react-router';

export default class TripIndex extends Component {
  componentWillMount() {
    browserHistory.push(this.getRedirect());
  }

  componentWillReceiveProps(nextProps) {
    browserHistory.push(this.getRedirect());
  }

  getRedirect() {
    const trip = this.props.trip;
    const firstSceneName = trip.script.content.scenes[0].name;
    const onFirstScene = (
      trip.currentSceneName === firstSceneName ||
      trip.currentSceneName === ''
    );
    if (onFirstScene) {
      return (
        `/${trip.org.name}/${trip.experience.name}` +
        `/operate/${trip.groupId}` +
        `/trip/${trip.id}/values`
      );
    }
    return (
      `/${trip.org.name}/${trip.experience.name}` +
      `/operate/${trip.groupId}` +
      `/trip/${trip.id}/scenes`
    );
  }

  render() {
    return <div>Redirecting</div>;
  }
}

TripIndex.propTypes = {
  trip: PropTypes.object.isRequired
};
