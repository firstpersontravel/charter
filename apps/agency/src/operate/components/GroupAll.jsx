import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

import { Evaluator, Registry } from 'fptcore';

import ResponsiveTabs from '../../partials/ResponsiveTabs';
import { sortForRole, canRoleHaveUser } from '../utils';

const evaluator = new Evaluator(Registry);

function getAllPlayers(trips) {
  const tripsById = _.fromPairs(_.map(trips, t => [t.id, t]));
  return _(trips)
    .map('players')
    .flatten()
    .filter(player => evaluator.if(
      tripsById[player.tripId].actionContext,
      player.role.active_if
    ))
    .value();
}

const archivedIcon = <i className="fa fa-archive ml-1" />;

function renderTripItem(group, trip, isToplevel) {
  return {
    key: trip.id,
    url: (
      `/${group.org.name}/${group.experience.name}` +
      `/operate/${group.id}` +
      `/trip/${trip.id}`
    ),
    text: `${trip.title} ${trip.isArchived ? ' (archived)' : ''}`,
    label: (
      <span>
        {isToplevel ? 'Trip: ' : ''}
        {trip.title} {trip.isArchived ? archivedIcon : null}
      </span>
    )
  };
}

function renderTripsItem(group, currentTripId) {
  if (!group.trips.length) {
    return null;
  }
  if (group.trips.length === 1) {
    return renderTripItem(group, group.trips[0], true);
  }
  let tripTitle = 'Trips';
  let tripLabel = 'Trips';
  if (currentTripId) {
    const trip = _.find(group.trips, { id: Number(currentTripId) });
    if (trip) {
      tripTitle = `Trip: ${trip.title}`;
      tripLabel = (
        <span>{tripTitle}{trip.isArchived ? archivedIcon : null}</span>
      );
    }
  }
  return {
    text: tripTitle,
    label: tripLabel,
    url: `/${group.org.name}/${group.experience.name}/operate/${group.id}/trip`,
    subItems: _(group.trips)
      .map(trip => renderTripItem(group, trip))
      .value()
  };
}

export default function GroupAll({ children, group, nextUnappliedAction,
  numMessagesNeedingReply, match, history }) {
  // Error or loading cases should be handled by `Group`
  if (group.trips.length === 0) {
    return <div>No trips</div>;
  }
  const roles = _(group.script.content.roles)
    .filter(role => canRoleHaveUser(role))
    .sortBy([sortForRole, 'name'])
    .value();
  const allPlayers = getAllPlayers(group.trips);
  const allUsers = _(allPlayers).map('user').uniq().value();

  let roleTitle = 'Roles';

  const path = history.location.pathname;
  const pathRoleMatch = path.match(/\/role\/([\w_-]+)\/(\d+)/);
  const pathRoleName = pathRoleMatch ? pathRoleMatch[1] : null;
  const pathUserId = pathRoleMatch ? pathRoleMatch[2] : null;

  if (pathRoleName && pathUserId) {
    const role = _.find(group.script.content.roles, {
      name: pathRoleName
    });
    const userTitle = pathUserId !== '0' ?
      _.get(_.find(allUsers, { id: Number(pathUserId) }), 'firstName') :
      'No user';
    roleTitle = `Role: ${role.title} (${userTitle})`;
  }

  const pathTripMatch = path.match(/\/trip\/(\d+)/);
  const pathTripId = pathTripMatch ? pathTripMatch[1] : null;
  const tripsItem = renderTripsItem(group, pathTripId);

  const items = [{
    text: 'Group',
    isExact: true,
    url: `/${group.org.name}/${group.experience.name}/operate/${group.id}`
  }, {
    text: 'Users',
    url: `/${group.org.name}/${group.experience.name}/operate/${group.id}/casting`
  }, {
    text: roleTitle,
    url: `/${group.org.name}/${group.experience.name}/operate/${group.id}/role`,
    subItems: _(roles)
      .map(role => (
        _(allPlayers)
          .filter('currentPageName')
          .filter({ roleName: role.name })
          .map('user')
          .uniq()
          .map(user => ({
            url: (
              `/${group.org.name}/${group.experience.name}` +
              `/operate/${group.id}` +
              `/role/${role.name}/${user ? user.id : 0}`
            ),
            text: `${role.title} (${user ? user.firstName : 'No user'})`
          }))
          .flatten()
          .value()
      ))
      .flatten()
      .value()
  }, tripsItem];

  if (numMessagesNeedingReply) {
    items.push({
      label: (
        <span>
          <span style={{ position: 'relative', top: '-2px' }} className="badge badge-warning mr-1">
            <i className="fa fa-comment" />
            {numMessagesNeedingReply}
          </span>
          Messages
        </span>
      ),
      text: 'Messages',
      url: `/${group.org.name}/${group.experience.name}/operate/${group.id}/messages`
    });
  }

  if (nextUnappliedAction) {
    items.push({
      text: 'Upcoming',
      label: (
        <span>
          <span style={{ position: 'relative', top: '-2px' }} className="badge badge-info mr-1">
            {moment
              .utc(nextUnappliedAction.scheduledAt)
              .tz(group.experience.timezone)
              .format('h:mm:ssa')}
          </span>
          Upcoming
        </span>
      ),
      url: `/${group.org.name}/${group.experience.name}/operate/${group.id}/upcoming`
    });
  }

  return (
    <div>
      <ResponsiveTabs items={items} history={history} />
      {children}
    </div>
  );
}

GroupAll.propTypes = {
  children: PropTypes.node.isRequired,
  match: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  group: PropTypes.object.isRequired,
  nextUnappliedAction: PropTypes.object,
  numMessagesNeedingReply: PropTypes.number.isRequired
};

GroupAll.defaultProps = {
  nextUnappliedAction: null
};
