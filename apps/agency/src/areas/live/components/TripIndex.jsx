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
    const trip = this.props.tripStatus.instance;
    const firstSceneName = trip.script.content.scenes[0].name;
    const onFirstScene = trip.currentSceneName === firstSceneName;
    if (onFirstScene) {
      return (
        `/agency/live/${this.props.params.groupId}` +
        `/trip/${this.props.params.tripId}/values`
      );
    }
    const primaryRole = (
      _.find(trip.script.content.roles, { primary: true }) ||
      trip.script.content.roles[0]
    );
    return (
      `/agency/live/${this.props.params.groupId}` +
      `/trip/${this.props.params.tripId}` +
      `/participants/${primaryRole.name}`
    );
  }

  render() {
    return <div>Redirecting</div>;
  }
}

TripIndex.propTypes = {
  params: PropTypes.object.isRequired,
  tripStatus: PropTypes.object.isRequired
};
