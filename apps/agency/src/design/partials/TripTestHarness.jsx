import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

import {
  Kernel,
  ContextCore,
  PlayerCore,
  SceneCore,
  TripCore
} from 'fptcore';

import TripState from './TripState';

function getInitialTripFields(script, variantNames) {
  const date = moment.utc().format('YYYY-MM-DD');
  const tripFields = TripCore.getInitialFields(script.content, date,
    script.experience.timezone, variantNames);
  return Object.assign({
    title: 'Test',
    history: {}
  }, tripFields);
}

function getInitialPlayerFields(script, variantNames, roleName) {
  const playerFields = PlayerCore.getInitialFields(script.content, roleName,
    variantNames);
  return Object.assign({}, playerFields, { roleName: roleName });
}

function getInitialState(script, variantNames) {
  return {
    trip: getInitialTripFields(script, variantNames),
    players: _(script.content.roles)
      .map(role => getInitialPlayerFields(script, variantNames, role.name))
      .value(),
    log: []
  };
}

class TripKernel {
  constructor(state, updateState, onEvent) {
    this.state = state;
    this.updateState = updateState;
  }

  updateTripFields({ fields }) {
    this.updateState({
      trip: Object.assign({}, this.state.trip, fields)
    });
  }

  updateTripHistory({ history }) {
    this.updateState({
      trip: Object.assign({}, this.state.trip, {
        history: Object.assign({}, this.state.trip.history, history)
      })
    });
  }

  updateTripValues({ values }) {
    this.updateState({
      trip: Object.assign({}, this.state.trip, {
        values: Object.assign({}, this.state.trip.values, values)
      })
    });
  }

  updatePlayerFields({ roleName, fields }) {
    const players = this.state.players;
    const index = _.findIndex(players, { roleName: roleName });
    const player = players[index];
    this.updateState({
      players: _.set(players.slice(), index, Object.assign({}, player, fields))
    });
  }

  createMessage({ fields }) {
    this.log({ level: 'info', message: `"${fields.content}"` });
  }

  event() {}
  initiateCall() {}

  log({ level, message }) {
    this.updateState({
      log: [{
        id: this.state.log.length,
        time: moment(),
        level: level,
        message: message
      }].concat(this.state.log).slice(0, 100)
    });
  }
}

// eslint-disable-next-line react/prefer-stateless-function
export default class TripTestHarness extends Component {
  constructor(props) {
    super(props);
    this.state = getInitialState(props.script, props.variantNames);
    this.handleAction = this.handleAction.bind(this);
    this.handleTrigger = this.handleTrigger.bind(this);
    this.handleEvent = this.handleEvent.bind(this);
    this.processStateUpdate = this.processStateUpdate.bind(this);
  }

  componentDidMount() {
    this.startTrip();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.script.id !== this.props.script.id ||
        nextProps.variantNames.join(',') !==
        this.props.variantNames.join(',')) {
      this.resetState(nextProps.script, nextProps.variantNames);
    }
  }

  componentDidUpdate() {
    delete this.pendingState;
  }

  getBaseTripObject() {
    const state = this.pendingState || this.state;
    const script = this.props.script;
    const trip = Object.assign({}, state.trip, {
      script: script,
      org: script.org,
      experience: script.experience
    });
    trip.players = state.players.map(player => (
      Object.assign({}, player, {
        role: _.find(script.content.roles, { name: player.roleName }),
        trip: trip
      })
    ));
    return trip;
  }

  getTripObject() {
    const trip = this.getBaseTripObject();
    trip.evalContext = this.getEvalContext();
    trip.actionContext = { evalContext: trip.evalContext };
    return trip;
  }

  getEvalContext() {
    const trip = this.getBaseTripObject();
    const env = { host: '' };
    return ContextCore.gatherEvalContext(env, trip);
  }

  getActionContext() {
    return {
      scriptContent: this.props.script.content,
      evalContext: this.getEvalContext(),
      evaluateAt: moment.utc(),
      timezone: this.props.script.experience.timezone
    };
  }

  processStateUpdate(newState) {
    const existingState = this.pendingState || this.state;
    this.pendingState = Object.assign({}, existingState, newState);
    this.setState(newState);
  }

  processResultOp(resultOp) {
    const kernel = new TripKernel(
      this.pendingState || this.state,
      this.processStateUpdate
    );
    if (!kernel[resultOp.operation]) {
      console.info(resultOp);
      console.warn(`Unhandled operation "${resultOp.operation}".`);
      return;
    }
    kernel[resultOp.operation].call(kernel, resultOp);
  }

  processScheduledAction(scheduledAction) {
    this.handleAction(scheduledAction.name, scheduledAction.params);
  }

  processResult(result) {
    result.resultOps.forEach(resultOp => (
      this.processResultOp(resultOp)
    ));
    result.scheduledActions.forEach(scheduledAction => (
      this.processScheduledAction(scheduledAction)
    ));
  }

  handleAction(name, params) {
    console.log('Action', name);
    const action = { name: name, params: params };
    const actionContext = this.getActionContext();
    const result = Kernel.resultForImmediateAction(action, actionContext);
    this.processResult(result);
  }

  handleEvent(event) {
    console.log('Event', event);
    const actionContext = this.getActionContext();
    const result = Kernel.resultForEvent(event, actionContext);
    this.processResult(result);
  }

  handleTrigger(name) {
    console.log('Trigger', name);
    const trigger = _.find(this.props.script.content.triggers, { name: name });
    const actionContext = this.getActionContext();
    const result = Kernel.resultForTrigger(trigger, null, actionContext,
      actionContext);
    this.processResult(result);
  }

  startTrip() {
    const firstSceneName = SceneCore.getStartingSceneName(
      this.props.script.content, this.state.trip.actionContext);
    if (firstSceneName) {
      this.handleAction('start_scene', { scene_name: firstSceneName });
    }
  }

  resetState(script, variantNames) {
    const state = getInitialState(script, variantNames);
    this.pendingState = state;
    this.setState(state);
    this.startTrip();
  }

  renderLogEntry(logEntry) {
    const logEntryIcons = {
      info: <i className="fa fa-info-circle mr-1" />,
      warning: <i className="fa fa-exclamation-circle mr-1" />
    };
    return (
      <div key={logEntry.id}>
        <span className="mr-1">{logEntry.time.format('h:mma')}</span>
        {logEntryIcons[logEntry.level]}
        {logEntry.message}
      </div>
    );
  }

  renderLog() {
    return this.state.log.map(logEntry => (
      this.renderLogEntry(logEntry)
    ));
  }

  render() {
    const trip = this.getTripObject();
    return (
      <div className="row">
        <div className="col-sm-10 script-editor-full-height">
          <TripState
            trip={trip}
            onAction={this.handleAction}
            onTrigger={this.handleTrigger} />
        </div>
        <div className="col-sm-2 script-editor-full-height">
          {this.renderLog()}
        </div>
      </div>
    );
  }
}

TripTestHarness.propTypes = {
  script: PropTypes.object.isRequired,
  variantNames: PropTypes.arrayOf(PropTypes.string).isRequired
};
