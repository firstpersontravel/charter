import React, { Component } from 'react';
import PropTypes from 'prop-types';

import SceneGrid from '../../scenegrid/SceneGrid';

export default class TripScenes extends Component {
  constructor(props) {
    super(props);
    this.handleTrigger = this.handleTrigger.bind(this);
    this.handleAction = this.handleAction.bind(this);
    this.handleAdminAction = this.handleAdminAction.bind(this);
  }

  handleTrigger(triggerName) {
    const trip = this.props.trip;
    this.props.postAdminAction(
      trip.orgId, trip.experienceId, trip.id,
      'trigger', { trigger_name: triggerName });
  }

  handleAction(actionName, actionParams) {
    const trip = this.props.trip;
    this.props.postAction(trip.orgId, trip.experienceId, trip.id, actionName,
      actionParams);
  }

  handleAdminAction(actionName, actionParams) {
    const trip = this.props.trip;
    this.props.postAdminAction(trip.orgId, trip.experienceId,
      trip.id, actionName, actionParams, true);
  }

  render() {
    const trip = this.props.trip;
    return (
      <SceneGrid
        trip={trip}
        onAction={this.handleAction}
        onTrigger={this.handleTrigger}
        onAdminAction={this.handleAdminAction} />
    );
  }
}

TripScenes.propTypes = {
  trip: PropTypes.object.isRequired,
  postAction: PropTypes.func.isRequired,
  postAdminAction: PropTypes.func.isRequired
};
