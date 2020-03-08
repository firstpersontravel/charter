import _ from 'lodash';
import moment from 'moment-timezone';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { isProduction } from '../../utils';

function renderAlert() {
  if (!isProduction()) {
    return null;
  }
  return (
    <div className="alert alert-danger">
      <strong>Warning!</strong> Use these controls with caution!
    </div>
  );
}

export default class TripControls extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pendingCheckpointName: '__start'
    };
    this.handleAdminAction = this.handleAdminAction.bind(this);
    this.handleNotifyAction = this.handleNotifyAction.bind(this);
    this.handleCheckpointApply = this.handleCheckpointApply.bind(this);
    this.handleCheckpointChange = this.handleCheckpointChange.bind(this);
  }

  handleAdminAction(name, params) {
    this.props.postAdminAction(
      this.props.trip.orgId,
      this.props.trip.experienceId,
      this.props.trip.id, name, params || {});
  }

  handleNotifyAction(notifyType) {
    this.handleAdminAction('notify', { notify_type: notifyType });
  }

  handleCheckpointApply(event) {
    event.preventDefault();
    this.handleAdminAction('reset',
      { checkpoint_name: this.state.pendingCheckpointName });
    this.setState({ pendingCheckpointName: '__start' });
  }

  handleCheckpointChange(event) {
    this.setState({ pendingCheckpointName: event.target.value });
  }

  renderRefresh() {
    const btnOutlineDangerClass = isProduction() ?
      'btn-outline-danger' : 'btn-outline-primary';
    const ffButtons = (this.props.trip.script && this.props.nextAction) ?
      ([
        <button
          key="ff-1"
          className={`btn ${btnOutlineDangerClass}`}
          onClick={() => this.handleAdminAction('fast_forward_next')}>
          <i className="fa fa-fast-forward" />
          &nbsp;{moment.utc(this.props.nextAction.scheduledAt).tz(this.props.trip.experience.timezone).format('h:mm:ssa')}
        </button>,
        <button
          key="ff-2"
          className={`btn ${btnOutlineDangerClass}`}
          onClick={() => this.handleAdminAction('fast_forward')}>
          <i className="fa fa-fast-forward" /> Time
        </button>
      ]) :
      (
        <button
          disabled
          className={`btn ${btnOutlineDangerClass} btn-disabled`}>
          <i className="fa fa-fast-forward" /> Time
        </button>
      );
    return (
      <div className="mb-2">
        <h5>Device Refresh</h5>
        <div className="btn-group">
          <button
            className="btn btn-outline-primary"
            onClick={() => this.handleNotifyAction('request_ack')}>
            <i className="fa fa-hand-o-right" /> Request info
          </button>
          <button
            className="btn btn-outline-primary"
            onClick={() => this.handleNotifyAction('refresh')}>
            <i className="fa fa-hand-o-right" /> Data
          </button>
          <button
            className={`btn ${btnOutlineDangerClass}`}
            onClick={() => this.handleNotifyAction('reload')}>
            <i className="fa fa-hand-o-right" /> Page
          </button>
          {ffButtons}
          <button
            className={`btn ${btnOutlineDangerClass}`}
            onClick={() => this.handleNotifyAction('update_code')}>
            <i className="fa fa-hand-o-right" /> Update code
          </button>
        </div>
      </div>
    );
  }

  renderReset() {
    const defaultCheckpoint = { name: '__start', title: 'Start' };
    const checkpoints = [defaultCheckpoint]
      .concat(this.props.trip.script.content.checkpoints || []);
    const pendingCheckpoint = _.find(checkpoints,
      { name: this.state.pendingCheckpointName });
    const checkpointOptions = checkpoints.map(checkpoint => (
      <option
        key={checkpoint.name}
        value={checkpoint.name}>
        {checkpoint.title}
      </option>
    ));
    const btnDangerClass = isProduction() ? 'btn-danger' : 'btn-primary';
    return (
      <div>
        <h5>Reset</h5>
        <form className="row" onSubmit={this.handleCheckpointApply}>
          <div className="col-sm-8">
            <select
              className="form-control"
              value={this.state.pendingCheckpointName}
              onChange={this.handleCheckpointChange}>
              {checkpointOptions}
            </select>
          </div>
          <div className="col-sm-4">
            <button
              type="submit"
              disabled={!pendingCheckpoint}
              className={`btn btn-block ${btnDangerClass}`}>
              Reset to {pendingCheckpoint ? pendingCheckpoint.title : 'checkpoint'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  render() {
    return (
      <div>
        {renderAlert()}
        {this.renderRefresh()}
        {this.renderReset()}
      </div>
    );
  }
}

TripControls.propTypes = {
  nextAction: PropTypes.object,
  trip: PropTypes.object.isRequired,
  postAdminAction: PropTypes.func.isRequired
};

TripControls.defaultProps = {
  nextAction: null
};
