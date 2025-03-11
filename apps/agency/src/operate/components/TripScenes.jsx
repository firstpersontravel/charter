import React, { Component } from 'react';
import PropTypes from 'prop-types';

import SceneGrid from '../../scenegrid/SceneGrid';

export default class TripScenes extends Component {
  constructor(props) {
    super(props);
    this.handleTrigger = this.handleTrigger.bind(this);
    this.handleAction = this.handleAction.bind(this);
    this.handleAdminAction = this.handleAdminAction.bind(this);
    this.handleEvent = this.handleEvent.bind(this);
  }

  handleTrigger(triggerName, event) {
    const { trip } = this.props;
    this.props.postAdminAction(
      trip.orgId, trip.experienceId, trip.id,
      'trigger', { trigger_name: triggerName, event: event }
    );
  }

  handleAdminAction(name, params) {
    const { trip } = this.props;
    this.props.postAdminAction(
      trip.orgId, trip.experienceId, trip.id, name, params
    );
  }

  handleAction(actionName, actionParams, playerId) {
    const { trip } = this.props;
    this.props.postAction(trip.orgId, trip.experienceId, trip.id, actionName,
      actionParams, playerId);
  }

  handleEvent(event, playerId) {
    const { trip } = this.props;
    this.props.postEvent(trip.orgId, trip.experienceId, trip.id, event, playerId);
  }

  render() {
    const { trip } = this.props;
    return (
      <div className="container-fluid">
        <SceneGrid
          trip={trip}
          onEvent={this.handleEvent}
          onAction={this.handleAction}
          onAdminAction={this.handleAdminAction}
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
