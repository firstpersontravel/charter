import _ from 'lodash';
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
    const primaryRole = (
      _.find(trip.script.content.roles, { primary: true }) ||
      trip.script.content.roles[0]
    );
    return (
      `/${trip.org.name}/${trip.experience.name}` +
      `/operate/${trip.groupId}` +
      `/trip/${trip.id}` +
      `/players/${primaryRole.name}`
    );
  }

  render() {
    return <div>Redirecting</div>;
  }
}

TripIndex.propTypes = {
  trip: PropTypes.object.isRequired
};
