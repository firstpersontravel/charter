import React, { Component } from 'react';
import PropTypes from 'prop-types';

import SceneGrid from '../../scenegrid/SceneGrid';

export default class TripScenes extends Component {
  constructor(props) {
    super(props);
    this.handleTrigger = this.handleTrigger.bind(this);
    this.handleAction = this.handleAction.bind(this);
    this.handleEvent = this.handleEvent.bind(this);
  }

  handleTrigger(triggerName, event) {
    const trip = this.props.trip;
    this.props.postAdminAction(
      trip.orgId, trip.experienceId, trip.id,
      'trigger', { trigger_name: triggerName, event: event });
  }

  handleAction(actionName, actionParams) {
    const trip = this.props.trip;
    this.props.postAction(trip.orgId, trip.experienceId, trip.id, actionName,
      actionParams);
  }

  handleEvent(event) {
    const trip = this.props.trip;
    this.props.postEvent(trip.orgId, trip.experienceId, trip.id, event);
  }

  render() {
    const trip = this.props.trip;
    return (
      <div className="container-fluid">
        <SceneGrid
          trip={trip}
          onEvent={this.handleEvent}
          onAction={this.handleAction}
          onTrigger={this.handleTrigger} />
      </div>
    );
  }
}

TripScenes.propTypes = {
  trip: PropTypes.object.isRequired,
  postAction: PropTypes.func.isRequired,
  postAdminAction: PropTypes.func.isRequired,
  postEvent: PropTypes.func.isRequired
};
