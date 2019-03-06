import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { IndexLink, Link } from 'react-router';

import { EvalCore } from 'fptcore';

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

  let tripTitle = 'Trips';
  if (params.tripId) {
    const trip = _.find(group.trips, { id: Number(params.tripId) });
    if (trip) {
      tripTitle = `Trip: ${trip.departureName} ${trip.title}`;
    }
  }

  const roleLinks = _(roles)
    .map(role => (
      _(allPlayers)
        .filter({ roleName: role.name })
        .map('user')
        .uniq()
        .map(user => (
          <Link
            key={`${role.name}-${user ? user.id : 0}`}
            className="dropdown-item"
            to={
              `/${group.org.name}/${group.experience.name}` +
              `/operate/${group.id}` +
              `/role/${role.name}/${user ? user.id : 0}`}>
            {role.title} ({user ? user.firstName : 'No user'})
          </Link>
        ))
        .flatten()
        .value()
    ))
    .value();

  const tripLinks = _(group.trips)
    .map(trip => (
      <Link
        key={trip.id}
        className="dropdown-item"
        to={
          `/${group.org.name}/${group.experience.name}` +
          `/operate/${group.id}` +
          `/trip/${trip.id}`}>
        {trip.departureName} {trip.title}
      </Link>
    ))
    .value();

  const replyWarning = numMessagesNeedingReply > 0 ? (
    <span style={{ marginRight: '0.25em', position: 'relative', top: '-2px' }} className="badge badge-warning">
      <i className="fa fa-comment" />
      {numMessagesNeedingReply}
    </span>
  ) : null;

  const nextActionWarning = nextUnappliedAction ? (
    <span style={{ marginRight: '0.25em', position: 'relative', top: '-2px' }} className="badge badge-info">
      {moment
        .utc(nextUnappliedAction.scheduledAt)
        .tz(group.experience.timezone)
        .format('h:mm:ssa')}
    </span>
  ) : null;

  return (
    <div>
      <ul className="nav nav-tabs">
        <li className="nav-item">
          <IndexLink
            className="nav-link"
            activeClassName="active"
            to={`/${group.org.name}/${group.experience.name}/operate/${group.id}`}>
            Overview
          </IndexLink>
        </li>
        <li className="nav-item">
          <Link
            className="nav-link"
            activeClassName="active"
            to={`/${group.org.name}/${group.experience.name}/operate/${group.id}/casting`}>
            Users
          </Link>
        </li>
        <li className="nav-item dropdown">
          <Link
            className="nav-link dropdown-toggle"
            activeClassName="active"
            data-toggle="dropdown"
            to={`/${group.org.name}/${group.experience.name}/operate/${group.id}/role`}>
            {roleTitle}
          </Link>
          <div className="dropdown-menu">
            {roleLinks}
          </div>
        </li>
        <li className="nav-item dropdown">
          <Link
            className="nav-link dropdown-toggle"
            activeClassName="active"
            data-toggle="dropdown"
            to={`/${group.org.name}/${group.experience.name}/operate/${group.id}/trip`}>
            {tripTitle}
          </Link>
          <div className="dropdown-menu">
            {tripLinks}
          </div>
        </li>
        <li className="nav-item">
          <Link
            className="nav-link"
            activeClassName="active"
            to={`/${group.org.name}/${group.experience.name}/operate/${group.id}/replies`}>
            {replyWarning}
            Messages
          </Link>
        </li>
        <li className="nav-item">
          <Link
            className="nav-link"
            activeClassName="active"
            to={`/${group.org.name}/${group.experience.name}/operate/${group.id}/upcoming`}>
            {nextActionWarning}
            Upcoming
          </Link>
        </li>
      </ul>
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
