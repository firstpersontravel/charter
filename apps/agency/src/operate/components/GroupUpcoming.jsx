import _ from 'lodash';
import moment from 'moment';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { coreRegistry, KernelTriggers } from 'fptcore';

import { renderParams } from '../../partials/params';

function getScheduledTripTriggers(trip) {
  const now = moment.utc();
  const inOneHour = now.clone().add(1, 'hour');
  const event = { type: 'time_occurred', timestamp: inOneHour };
  const triggers = KernelTriggers.triggersForEvent(event,
    trip.actionContext);
  return triggers.map(trigger => ({
    id: trigger.name,
    type: 'trigger',
    tripId: trip.id,
    scheduledAt: coreRegistry.events.time_occurred.timeForSpec(
      trigger.event, trip.evalContext),
    name: trigger.name
  }));
}

function getScheduledGroupTriggers(group) {
  return _(group.trips)
    .map(trip => getScheduledTripTriggers(trip))
    .flatten()
    .value();
}

export default class GroupUpcoming extends Component {
  renderTrigger(trigger, trip) {
    const timeShort = moment
      .utc(trigger.scheduledAt)
      .tz(trip.experience.timezone)
      .format('ddd h:mm:ssa');
    const cellClass = 'upcoming-unarchived';

    const applyNowButton = (
      <button
        className="btn btn-sm btn-outline-secondary"
        onClick={() => {
          this.props.postAdminAction(trip.orgId, trip.experienceId, trip.id,
            'trigger', { trigger_name: trigger.name });
        }}>
        Apply now
      </button>
    );

    return (
      <tr key={trigger.id}>
        <td className={cellClass}>{timeShort}</td>
        <td className={cellClass}>{trip.title}</td>
        <td className={cellClass}>{trigger.type}</td>
        <td className={cellClass}>{trigger.name}</td>
        <td className={cellClass} />
        <td className={cellClass}>{applyNowButton}</td>
      </tr>
    );
  }

  renderAction(action, trip) {
    const timeShort = moment
      .utc(action.scheduledAt)
      .tz(trip.experience.timezone)
      .format('ddd h:mm:ssa');
    const actionResourceClass = coreRegistry.actions[action.name];
    const values = renderParams(trip.script, actionResourceClass.params,
      action.params);
    const cellClass = action.isArchived ?
      'upcoming-archived' : 'upcoming-unarchived';

    const archiveButton = (
      <button
        className="btn btn-sm btn-outline-secondary"
        onClick={() => {
          this.props.updateInstance('actions', action.id, {
            isArchived: !action.isArchived
          });
          this.props.postAdminAction(trip.orgId, trip.experienceId, trip.id,
            'notify', { notify_type: 'refresh' });
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
          this.props.postAdminAction(trip.orgId, trip.experienceId, trip.id,
            'notify', { notify_type: 'refresh' });
        }}>
        Apply now
      </button>
    );

    return (
      <tr key={action.id}>
        <td className={cellClass}>{timeShort}</td>
        <td className={cellClass}>{trip.title}</td>
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
    const group = this.props.group;
    const trips = group.trips;
    const scheduledTriggers = getScheduledGroupTriggers(group);
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
            <th>Trip</th>
            <th>Type</th>
            <th>Action</th>
            <th>Parameters</th>
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
  group: PropTypes.object.isRequired,
  postAdminAction: PropTypes.func.isRequired,
  updateInstance: PropTypes.func.isRequired,
  actions: PropTypes.array.isRequired
};
