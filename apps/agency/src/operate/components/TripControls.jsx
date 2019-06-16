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
      sendingCommand: '',
      pendingCommand: '',
      pendingCheckpointName: '',
      pendingTriggerName: '',
      pendingCueName: ''
    };
    this.handleAdminAction = this.handleAdminAction.bind(this);
    this.handleNotifyAction = this.handleNotifyAction.bind(this);
    this.handleCheckpointApply = this.handleCheckpointApply.bind(this);
    this.handleCheckpointChange = this.handleCheckpointChange.bind(this);
    this.handleCommandApply = this.handleCommandApply.bind(this);
    this.handleCommandChange = this.handleCommandChange.bind(this);
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
    this.setState({ pendingCheckpointName: '' });
  }

  handleCheckpointChange(event) {
    this.setState({ pendingCheckpointName: event.target.value });
  }

  handleCommandApply(event) {
    event.preventDefault();
    this.handleAdminAction('phrase',
      { action_phrase: this.state.pendingCommand });
    this.setState({
      sendingCommand: this.state.pendingCommand,
      pendingCommand: ''
    });
  }

  handleCueApply(event) {
    event.preventDefault();
    this.handleAdminAction('phrase',
      { action_phrase: `signal_cue ${this.state.pendingCueName}` });
    this.setState({ pendingCueName: '' });
  }

  handleCommandChange(event) {
    this.setState({ pendingCommand: event.target.value });
  }

  renderCommandError() {
    if (this.props.systemActionRequestState === 'pending') {
      return (
        <div className="alert alert-info">
          <strong>
            <i className="fa fa-spin fa-refresh" /> Sending
          </strong> {this.state.sendingCommand}
        </div>
      );
    }
    if (this.props.systemActionRequestState === 'rejected') {
      const err = this.props.systemActionRequestError || {};
      const text = err.message || 'Error';
      return (
        <div className="alert alert-warning">
          <strong>Error</strong> {text}
        </div>
      );
    }
    return null;
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

  renderCommand() {
    const btnDangerClass = isProduction() ? 'btn-danger' : 'btn-primary';
    const isCommandApplyDisabled = this.state.pendingCommand === '';
    return (
      <div className="mb-2">
        <h5>Command</h5>
        <form className="row" onSubmit={this.handleCommandApply}>
          <div className="col-sm-8">
            <input
              type="text"
              value={this.state.pendingCommand}
              onChange={this.handleCommandChange}
              className="form-control"
              placeholder={`Command for ${this.props.trip.departureName} ${this.props.trip.title}`} />
          </div>
          <div className="col-sm-4">
            <button
              type="submit"
              className={`btn btn-block ${btnDangerClass}`}
              disabled={isCommandApplyDisabled}>
              Apply command
            </button>
          </div>
        </form>
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
              <option value="">---</option>
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
        {this.renderCommandError()}
        {this.renderCommand()}
        {this.renderReset()}
      </div>
    );
  }
}

TripControls.propTypes = {
  nextAction: PropTypes.object,
  systemActionRequestState: PropTypes.string,
  systemActionRequestError: PropTypes.object,
  trip: PropTypes.object.isRequired,
  postAdminAction: PropTypes.func.isRequired
};

TripControls.defaultProps = {
  nextAction: null,
  systemActionRequestState: null,
  systemActionRequestError: null
};
