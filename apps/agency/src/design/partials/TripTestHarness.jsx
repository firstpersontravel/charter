import _ from 'lodash';
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import moment from 'moment';

import {
  Kernel,
  ContextCore,
  PlayerCore,
  SceneCore,
  TripCore,
  coreRegistry,
  coreWalker
} from 'fptcore';

import SceneGrid from '../../scenegrid/SceneGrid';
import { labelForSpec } from '../utils/spec-utils';
import { titleForResource } from '../utils/text-utils';
import { urlForResource } from '../utils/section-utils';
import { fullMediaUrl } from '../../operate/utils';

const maxParamLength = 30;
const maxMessageLength = 100;

function truncateMsg(msg, maxLength) {
  return msg.length > maxLength ? `${msg.slice(0, maxLength)}...` : msg;
}

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
      .map((vals, i) => Object.assign(vals, { id: i }))
      .value(),
    log: [],
    scheduledActions: [],
    nextTime: null
  };
}

function renderParam(script, key, spec, param) {
  if (spec.type === 'reference') {
    const collectionName = spec.collection;
    const collection = script.content[collectionName] || [];
    const resource = _.find(collection, { name: param });
    if (resource) {
      return (
        <Link to={urlForResource(script, collectionName, resource.name)}>
          {titleForResource(script.content, collectionName, resource)}
        </Link>
      );
    }
  }
  if (spec.type === 'componentReference') {
    const componentType = spec.componentType;
    const variantClass = coreRegistry[componentType][spec.componentVariant];
    const component = coreWalker.getComponentById(script.content,
      spec.componentType, param);
    if (variantClass.getTitle) {
      return variantClass.getTitle(component, script.content);
    }
  }
  if (typeof param === 'string') {
    return truncateMsg(param, maxParamLength);
  }
  return param;
}

function renderParams(script, spec, params) {
  return Object
    .entries(params)
    .filter(([key, val]) => spec[key])
    .map(([key, val]) => (
      <div key={key}>
        <span className="mr-1" style={{ fontVariant: 'small-caps' }}>
          {labelForSpec(spec[key], key)}:
        </span>
        {renderParam(script, key, spec[key], val)}
      </div>
    ));
}

function renderMessageContent(script, fields) {
  const role = (script.content.roles || [])
    .find(r => r.name === fields.fromRoleName);
  const roleTitle = role ? role.title : fields.fromRoleName;
  if (fields.medium === 'image') {
    const url = fullMediaUrl(script.org, script.experience, fields.content);
    return (
      <span>
        {roleTitle}:&nbsp;
        <img alt="Message" src={url} className="img-fluid" />
      </span>
    );
  }
  return `${roleTitle}: "${truncateMsg(fields.content, maxMessageLength)}"`;
}

class TripKernel {
  constructor(script, state, updateState) {
    this.script = script;
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
    this.log({
      level: 'info',
      type: 'Value update',
      message: Object.entries(values)
        .map(([key, val]) => `${key}: ${JSON.stringify(val)}`)
        .join(', ')
    });
  }

  createMessage({ fields }) {
    this.log({
      level: 'info',
      type: 'Message',
      message: renderMessageContent(this.script, fields)
    });
  }

  event() {}
  initiateCall() {}

  twiml(op) {
    const clause = op.clause === 'gather' ? op.subclause : op;
    this.log({
      level: 'info',
      type: 'Call',
      message:
        `${clause.clause}: ` +
        `${truncateMsg(clause.message || 'audio clip', maxMessageLength)}`
    });
  }

  log({ level, type, message }) {
    const maxNum = 50;
    const newEntry = {
      id: this.state.log.length,
      time: moment(),
      level: level,
      type: type,
      message: message
    };
    const newLog = [newEntry].concat(this.state.log).slice(0, maxNum);
    this.updateState({ log: newLog });
  }
}

// eslint-disable-next-line react/prefer-stateless-function
export default class TripTestHarness extends Component {
  constructor(props) {
    super(props);
    this.state = getInitialState(props.script, props.variantNames,
      props.startedAt);
    this.handleAction = this.handleAction.bind(this);
    this.handleAdminAction = this.handleAdminAction.bind(this);
    this.handleTrigger = this.handleTrigger.bind(this);
    this.handleEvent = this.handleEvent.bind(this);
    this.processStateUpdate = this.processStateUpdate.bind(this);
    this.handleTimer = this.handleTimer.bind(this);
    this.timer = null;
  }

  componentDidMount() {
    this.startTrip();
    this.timer = setInterval(this.handleTimer, 1000);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.script.id !== this.props.script.id ||
        nextProps.variantNames.join(',') !==
        this.props.variantNames.join(',') ||
        nextProps.startedAt !== this.props.startedAt) {
      this.resetState(nextProps.script, nextProps.variantNames);
    }
  }

  componentDidUpdate() {
    delete this.pendingState;
  }

  componentWillUnmount() {
    clearInterval(this.timer);
    this.timer = null;
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
      this.props.script,
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

  log(level, type, message) {
    this.processResultOp({
      operation: 'log',
      level: level,
      type: type,
      message: message
    });
  }

  processResult(result) {
    result.resultOps.forEach(resultOp => (
      this.processResultOp(resultOp)
    ));
    if (result.scheduledActions.length > 0) {
      const newScheduledActions = this.state.scheduledActions
        .concat(result.scheduledActions);
      this.setState({ scheduledActions: newScheduledActions });
    }
  }

  handleAction(name, params) {
    const script = this.props.script;
    const actionResourceClass = coreRegistry.actions[name];
    const actionInfo = renderParams(script, actionResourceClass.params,
      params);
    this.log('info', `Action: ${name}`, actionInfo);
    const action = { name: name, params: params };
    const actionContext = this.getActionContext();
    const result = Kernel.resultForImmediateAction(action, actionContext);
    this.processResult(result);
  }

  handleAdminAction(name, params) {}

  handleEvent(event) {
    const script = this.props.script;
    const eventResourceClass = coreRegistry.events[event.type];
    if (eventResourceClass.eventParams) {
      const eventInfo = renderParams(script, eventResourceClass.eventParams,
        event);
      this.log('info', `Event: ${event.type}`, eventInfo);
    }
    const actionContext = this.getActionContext();
    const result = Kernel.resultForEvent(event, actionContext);
    this.processResult(result);
  }

  handleTrigger(name, event) {
    // this.log('info', `Trigger: ${name}`);
    const trigger = _.find(this.props.script.content.triggers, { name: name });
    const actionContext = this.getActionContext();
    const result = Kernel.resultForTrigger(trigger, event, actionContext,
      actionContext);
    this.processResult(result);
  }

  handleTimer() {
    if (this.state.scheduledActions.length === 0) {
      return;
    }
    const now = moment.utc();
    const actionsToRun = this.state.scheduledActions
      .filter(action => moment(action.scheduleAt).isBefore(now));
    if (actionsToRun.length === 0) {
      // Don't set scheduled actions but update nextTime if an action is coming
      // in less than 15 secs.
      const nextEpochMsec = Math.min(...this.state.scheduledActions
        .map(a => a.scheduleAt.valueOf()));
      this.setState({ nextTime: nextEpochMsec });
      return;
    }
    actionsToRun.forEach((action) => {
      const actionContext = this.getActionContext();
      const result = Kernel.resultForImmediateAction(action, actionContext);
      this.processResult(result);
    });
    const actionsToKeep = this.state.scheduledActions
      .filter(action => moment(action.scheduleAt).isSameOrAfter(now));
    this.setState({ scheduledActions: actionsToKeep });
  }

  startTrip() {
    const actionContext = this.getActionContext();
    const firstSceneName = SceneCore.getStartingSceneName(
      this.props.script.content, actionContext);
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
    const badgeClasses = {
      info: 'badge-info',
      warn: 'badge-warning',
      error: 'badge-danger'
    };
    return (
      <div
        key={logEntry.id}
        style={{ wordBreak: 'break-word', overflow: 'hidden' }}>
        <span className={`badge ${badgeClasses[logEntry.level]} mr-1`}>
          {logEntry.type}
        </span>
        {logEntry.message}
      </div>
    );
  }

  renderScheduled() {
    if (!this.state.scheduledActions.length) {
      return null;
    }
    const numPending = this.state.scheduledActions.length;
    const nextEpochMsec = Math.min(...this.state.scheduledActions
      .map(a => a.scheduleAt.valueOf()));
    const nextTime = moment(nextEpochMsec).fromNow();
    return (
      <div className="alert alert-warning">
        <i className="fa fa-clock-o mr-1" />
        {numPending}; next {nextTime}
      </div>
    );
  }

  renderLog() {
    const numLogEntries = 25;
    return this.state.log
      .slice(0, numLogEntries)
      .map(logEntry => (
        this.renderLogEntry(logEntry)
      ));
  }

  render() {
    const trip = this.getTripObject();
    return (
      <div className="row row-eq-height script-tester-inner-container">
        <div className="col-sm-9 script-tester-col">
          <SceneGrid
            trip={trip}
            onEvent={this.handleEvent}
            onAction={this.handleAction}
            onAdminAction={this.handleAdminAction}
            onTrigger={this.handleTrigger} />
        </div>
        <div className="col-sm-3 script-tester-col">
          {this.renderScheduled()}
          {this.renderLog()}
        </div>
      </div>
    );
  }
}

TripTestHarness.propTypes = {
  script: PropTypes.object.isRequired,
  variantNames: PropTypes.arrayOf(PropTypes.string).isRequired,
  startedAt: PropTypes.number.isRequired
};
