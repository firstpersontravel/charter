import _ from 'lodash';
import moment from 'moment';
import React, { Component } from 'react';
import { Link } from 'react-router';
import PropTypes from 'prop-types';

import { ActionsRegistry, EventsRegistry, TriggerEventCore } from 'fptcore';

import Param from '../../partials/Param';

function getScheduledTripTriggers(trip) {
  const now = moment.utc();
  const inOneHour = now.clone().add(1, 'hour');
  const event = {
    type: 'time_occurred',
    last_timestamp: now.unix(),
    to_timestamp: inOneHour
  };
  const triggers = TriggerEventCore.triggersForEvent(event,
    trip.actionContext);
  return triggers.map((trigger) => {
    const triggerEvent = TriggerEventCore.triggerEventForEventType(
      trigger, event.type);
    const scheduledAt = EventsRegistry.time_occurred.timeForSpec(
        triggerEvent[event.type], trip.evalContext);
    return {
      id: trigger.name,
      type: 'trigger',
      tripId: trip.id,
      scheduledAt: scheduledAt,
      departureName: trip.departureName,
      name: trigger.name
    };
  });
}

function getScheduledGroupTriggers(groupStatus) {
  return _(groupStatus.instance.trips)
    .map(trip => getScheduledTripTriggers(trip))
    .flatten()
    .value();
}

export default class GroupUpcoming extends Component {

  renderActionParam(trip, action, paramName) {
    const organizationName = this.props.params.organizationName;
    const actionParamsSpec = ActionsRegistry[action.name].params;
    return (
      <div className="wrap-text" key={paramName}>
        {paramName}:&nbsp;
        <Param
          organizationName={organizationName}
          scriptId={trip.scriptId}
          spec={actionParamsSpec[paramName]}
          value={action.params[paramName]} />
      </div>
    );
  }

  renderTrigger(trigger, trip) {
    const organizationName = this.props.params.organizationName;
    const timeShort = moment
      .utc(trigger.scheduledAt)
      .tz(trip.experience.timezone)
      .format('ddd h:mm:ssa');
    const cellClass = 'upcoming-unarchived';

    return (
      <tr key={trigger.id}>
        <td className={cellClass}>{timeShort}</td>
        <td className={cellClass}>{trip.departureName}</td>
        <td className={cellClass}>{trigger.type}</td>
        <td className={cellClass}>
          <Link to={`/${organizationName}/design/script/${trip.script.id}/collection/triggers/resource/${trigger.name}`}>
            {trigger.name}
          </Link>
        </td>
        <td className={cellClass} />
        <td />
      </tr>
    );
  }

  renderAction(action, trip) {
    const timeShort = moment
      .utc(action.scheduledAt)
      .tz(trip.experience.timezone)
      .format('ddd h:mm:ssa');
    const values = _.keys(action.params).map(k => (
      this.renderActionParam(trip, action, k)
    ));
    const cellClass = action.isArchived ?
      'upcoming-archived' : 'upcoming-unarchived';

    const archiveButton = (
      <button
        className="btn btn-sm btn-outline-secondary"
        onClick={() => {
          this.props.updateInstance('actions', action.id, {
            isArchived: !action.isArchived
          });
          this.props.postAdminAction(trip.id, 'notify', {
            notify_type: 'refresh'
          });
        }}>
        {action.isArchived ? 'Unarchive' : 'Archive'}
      </button>
    );

    const archiveIfAction = action.type === 'action' ? archiveButton : null;

    const applyNowButton = (
      <button
        className="btn btn-sm btn-outline-secondary"
        onClick={() => {
          this.props.updateInstance('actions', action.id, {
            scheduledAt: moment.utc().toISOString()
          });
          this.props.postAdminAction(trip.id, 'notify', {
            notify_type: 'refresh'
          });
        }}>
        Apply now
      </button>
    );

    return (
      <tr key={action.id}>
        <td className={cellClass}>{timeShort}</td>
        <td className={cellClass}>{trip.departureName}</td>
        <td className={cellClass}>{action.type}</td>
        <td className={cellClass}>{action.name}</td>
        <td className={cellClass}>{values}</td>
        <td>
          {archiveIfAction}
          &nbsp;
          {applyNowButton}
        </td>
      </tr>
    );
  }

  render() {
    const groupStatus = this.props.groupStatus;
    const trips = _.get(groupStatus, 'instance.trips') || [];
    if (!trips.length) {
      return (<div>No trips</div>);
    }
    const scheduledTriggers = getScheduledGroupTriggers(groupStatus);
    const allUpcoming = []
      .concat(this.props.actions)
      .concat(scheduledTriggers);

    const upcomingSorted = _.sortBy(allUpcoming, 'scheduledAt');
    if (!upcomingSorted.length) {
      return (
        <div className="alert alert-info">No upcoming actions!</div>
      );
    }

    const renderedActions = upcomingSorted.map((action) => {
      const trip = _.find(trips, { id: action.tripId });
      if (action.type === 'action') {
        return this.renderAction(action, trip);
      }
      if (action.type === 'trigger') {
        return this.renderTrigger(action, trip);
      }
      return null;
    });
    return (
      <table className="table table-sm table-striped table-responsive">
        <thead>
          <tr>
            <th>Time</th>
            <th>Dep</th>
            <th>Type</th>
            <th>Action</th>
            <th>Params</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {renderedActions}
        </tbody>
      </table>
    );
  }
}

GroupUpcoming.propTypes = {
  groupStatus: PropTypes.object.isRequired,
  postAdminAction: PropTypes.func.isRequired,
  updateInstance: PropTypes.func.isRequired,
  actions: PropTypes.array.isRequired,
  params: PropTypes.object.isRequired
};
