import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { IndexLink } from 'react-router';

import { EvalCore } from 'fptcore';

import ResponsiveTabs from '../../partials/ResponsiveTabs';
import { sortForRole } from '../utils';

function getAllPlayers(trips) {
  const tripsById = _.fromPairs(_.map(trips, t => [t.id, t]));
  return _(trips)
    .map('players')
    .flatten()
    .filter(player => (
      !player.role.if ||
      EvalCore.if(tripsById[player.tripId].evalContext, player.role.if)
    ))
    .value();
}

export default function GroupAll({ children, group,
  numMessagesNeedingReply, nextUnappliedAction, params }) {
  // Error or loading cases should be handled by `Group`
  if (group.trips.length === 0) {
    return <div>No trips</div>;
  }
  const roles = _(group.script.content.roles)
    .filter(role => role.user)
    .sortBy([sortForRole, 'name'])
    .value();
  const allPlayers = getAllPlayers(group.trips);
  const allUsers = _(allPlayers).map('user').value();

  let roleTitle = 'Roles';
  if (params.roleName && params.userId) {
    const role = _.find(group.script.content.roles, {
      name: params.roleName
    });
    const userTitle = params.userId !== '0' ?
      _.get(_.find(allUsers, { id: Number(params.userId) }), 'firstName') :
      'No user';
    roleTitle = `Role: ${role.title} (${userTitle})`;
  }

  const archivedIcon = <i className="fa fa-archive ml-1" />;
  let tripTitle = 'Trips';
  let tripLabel = 'Trips';
  if (params.tripId) {
    const trip = _.find(group.trips, { id: Number(params.tripId) });
    if (trip) {
      tripTitle = `Trip: ${trip.departureName} ${trip.title}`;
      tripLabel = (
        <span>{tripTitle}{trip.isArchived ? archivedIcon : null}</span>
      );
    }
  }

  const replyWarning = numMessagesNeedingReply > 0 ? (
    <span style={{ position: 'relative', top: '-2px' }} className="badge badge-warning mr-1">
      <i className="fa fa-comment" />
      {numMessagesNeedingReply}
    </span>
  ) : null;

  const nextActionWarning = nextUnappliedAction ? (
    <span style={{ position: 'relative', top: '-2px' }} className="badge badge-info mr-1">
      {moment
        .utc(nextUnappliedAction.scheduledAt)
        .tz(group.experience.timezone)
        .format('h:mm:ssa')}
    </span>
  ) : null;

  const items = [{
    text: 'Group',
    linkClass: IndexLink,
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
  }, {
    text: tripTitle,
    label: tripLabel,
    url: `/${group.org.name}/${group.experience.name}/operate/${group.id}/trip`,
    subItems: _(group.trips)
      .map(trip => ({
        url: (
          `/${group.org.name}/${group.experience.name}` +
          `/operate/${group.id}` +
          `/trip/${trip.id}`
        ),
        text: `${trip.departureName} ${trip.title}`,
        label: (
          <span>
            {trip.departureName} {trip.title}
            {trip.isArchived ? archivedIcon : null}
          </span>
        )
      }))
      .value()
  }, {
    label: <span>{replyWarning} Messages</span>,
    text: 'Messages',
    url: `/${group.org.name}/${group.experience.name}/operate/${group.id}/replies`
  }, {
    text: 'Upcoming',
    label: <span>{nextActionWarning} Upcoming</span>,
    url: `/${group.org.name}/${group.experience.name}/operate/${group.id}/upcoming`
  }];

  return (
    <div>
      <ResponsiveTabs items={items} />
      {children}
    </div>
  );
}

GroupAll.propTypes = {
  children: PropTypes.node.isRequired,
  params: PropTypes.object.isRequired,
  group: PropTypes.object.isRequired,
  nextUnappliedAction: PropTypes.object,
  numMessagesNeedingReply: PropTypes.number.isRequired
};

GroupAll.defaultProps = {
  nextUnappliedAction: null
};
