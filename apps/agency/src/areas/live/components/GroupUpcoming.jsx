import _ from 'lodash';
import moment from 'moment';
import React from 'react';
import { Link } from 'react-router';
import PropTypes from 'prop-types';

import { ActionsRegistry, EventsRegistry, TriggerEventCore } from 'fptcore';

import Param from '../../common/partials/Param';

function renderActionParam(trip, action, paramName) {
  const actionParamsSpec = ActionsRegistry[action.name].params;
  return (
    <div className="wrap-text" key={paramName}>
      {paramName}:&nbsp;
      <Param
        scriptId={trip.scriptId}
        spec={actionParamsSpec[paramName]}
        value={action.params[paramName]} />
    </div>
  );
}

function renderTrigger(trigger, trip, postAdminAction) {
  const timeShort = moment
    .utc(trigger.scheduledAt)
    .tz(trip.script.timezone)
    .format('ddd h:mm:ssa');
  const cellClass = 'upcoming-unarchived';

  return (
    <tr key={trigger.id}>
      <td className={cellClass}>{timeShort}</td>
      <td className={cellClass}>{trip.departureName}</td>
      <td className={cellClass}>{trigger.type}</td>
      <td className={cellClass}>
        <Link to={`/agency/scripts/version/${trip.script.id}/collection/triggers/resource/${trigger.name}`}>
          {trigger.name}
        </Link>
      </td>
      <td className={cellClass} />
      <td />
    </tr>
  );
}

function renderAction(action, trip, updateInstance, postAdminAction) {
  const timeShort = moment
    .utc(action.scheduledAt)
    .tz(trip.script.timezone)
    .format('ddd h:mm:ssa');
  const values = _.keys(action.params).map(k => (
    renderActionParam(trip, action, k)
  ));
  const cellClass = action.isArchived ?
    'upcoming-archived' : 'upcoming-unarchived';

  const archiveButton = (
    <button
      className="btn btn-sm btn-outline-secondary"
      onClick={() => {
        updateInstance('actions', action.id, {
          isArchived: !action.isArchived
        });
        postAdminAction(trip.id, 'notify', { notify_type: 'refresh' });
      }}>
      {action.isArchived ? 'Unarchive' : 'Archive'}
    </button>
  );

  const archiveIfAction = action.type === 'action' ? archiveButton : null;

  const applyNowButton = (
    <button
      className="btn btn-sm btn-outline-secondary"
      onClick={() => {
        updateInstance('actions', action.id, {
          scheduledAt: moment.utc().toISOString()
        });
        postAdminAction(trip.id, 'notify', { notify_type: 'refresh' });
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

function getScheduledTripTriggers(trip) {
  const now = moment.utc();
  const inOneHour = now.clone().add(1, 'hour');
  const event = {
    type: 'time_occurred',
    last_timestamp: now.unix(),
    to_timestamp: inOneHour
  };
  const triggers = TriggerEventCore.triggersForEvent(
    trip.script, trip.context, event);
  return triggers.map((trigger) => {
    const triggerEvent = TriggerEventCore.triggerEventForEventType(
      trigger, event.type);
    const scheduledAt = EventsRegistry.time_occurred.timeForSpec(
        trip.context, triggerEvent[event.type]);
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

function renderUpcomingActions(groupStatus, actions, updateInstance, postAdminAction) {
  const trips = _.get(groupStatus, 'instance.trips') || [];
  if (!trips.length) {
    return (<div>No trips</div>);
  }
  const scheduledTriggers = getScheduledGroupTriggers(groupStatus);
  const allUpcoming = [].concat(actions).concat(scheduledTriggers);
  const upcomingSorted = _.sortBy(allUpcoming, 'scheduledAt');
  if (!upcomingSorted.length) {
    return (
      <div className="alert alert-info">No upcoming actions!</div>
    );
  }
  const renderedActions = upcomingSorted.map((action) => {
    const trip = _.find(trips, { id: action.tripId });
    if (action.type === 'action') {
      return renderAction(action, trip, updateInstance, postAdminAction);
    }
    if (action.type === 'trigger') {
      return renderTrigger(action, trip, postAdminAction);
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

export default function GroupUpcoming({ groupStatus, actions, updateInstance, postAdminAction }) {
  const renderedActions = renderUpcomingActions(
    groupStatus, actions, updateInstance, postAdminAction);
  return (
    <div>
      {renderedActions}
    </div>
  );
}

GroupUpcoming.propTypes = {
  groupStatus: PropTypes.object.isRequired,
  postAdminAction: PropTypes.func.isRequired,
  updateInstance: PropTypes.func.isRequired,
  actions: PropTypes.array.isRequired
};
