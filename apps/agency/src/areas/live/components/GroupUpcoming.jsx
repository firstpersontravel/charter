import _ from 'lodash';
import moment from 'moment';
import React from 'react';
import PropTypes from 'prop-types';

import { Actions } from 'fptcore';

import Param from '../../common/partials/Param';

function renderActionParam(trip, action, paramName) {
  const actionParamsSpec = Actions[action.name].params;
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
        {archiveButton}
        &nbsp;
        {applyNowButton}
      </td>
    </tr>
  );
}

function renderUpcomingActions(groupStatus, actions, updateInstance, postAdminAction) {
  const trips = _.get(groupStatus, 'instance.trips') || [];
  const upcomingActions = _.sortBy(actions, 'scheduledAt');
  if (!upcomingActions.length) {
    return (
      <div className="alert alert-info">No upcoming actions!</div>
    );
  }
  const renderedActions = upcomingActions.map((action) => {
    const trip = _.find(trips, { id: action.playthroughId });
    return renderAction(action, trip, updateInstance, postAdminAction);
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
