import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { IndexLink, Link } from 'react-router';

import { EvalCore } from 'fptcore';

import { sortForRole } from '../utils';

export default function GroupAll({ children, params, groupStatus,
  numMessagesNeedingReply, nextUnappliedAction }) {
  // Error or loading cases should be handled by `Group`
  const orgName = params.orgName;
  if (groupStatus.instance.tripIds.length === 0) {
    return <div>No trips</div>;
  }
  const script = _.get(groupStatus, 'instance.script');
  if (!script) {
    return <div>No script</div>;
  }
  const roles = _(script.content.roles)
    .filter(role => role.user)
    .sortBy([sortForRole, 'name'])
    .value();
  const allPlayers = _(groupStatus.instance.trips)
    .map('players')
    .flatten()
    .filter(player => (
      !player.role.if ||
      EvalCore.if(player.trip.evalContext, player.role.if)
    ))
    .filter('currentPageName')
    .value();
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
            to={`/${orgName}/operate/${params.groupId}/all/role/${role.name}/${user ? user.id : 0}`}>
            {role.name} ({user ? user.firstName : 'No user'})
          </Link>
        ))
        .flatten()
        .value()
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
        .tz(groupStatus.instance.experience.timezone)
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
            to={`/${orgName}/operate/${params.groupId}/all`}>
            Overview
          </IndexLink>
        </li>
        <li className="nav-item">
          <Link
            className="nav-link"
            activeClassName="active"
            to={`/${orgName}/operate/${params.groupId}/all/casting`}>
            Casting
          </Link>
        </li>
        <li className="nav-item dropdown">
          <Link
            className="nav-link dropdown-toggle"
            activeClassName="active"
            data-toggle="dropdown"
            to={`/${orgName}/operate/${params.groupId}/all/role`}>
            Roles
          </Link>
          <div className="dropdown-menu">
            {roleLinks}
          </div>
        </li>
        <li className="nav-item">
          <Link
            className="nav-link"
            activeClassName="active"
            to={`/${orgName}/operate/${params.groupId}/all/replies`}>
            {replyWarning}
            Replies
          </Link>
        </li>
        <li className="nav-item">
          <Link
            className="nav-link"
            activeClassName="active"
            to={`/${orgName}/operate/${params.groupId}/all/upcoming`}>
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
  groupStatus: PropTypes.object.isRequired,
  nextUnappliedAction: PropTypes.object,
  numMessagesNeedingReply: PropTypes.number.isRequired
};

GroupAll.defaultProps = {
  nextUnappliedAction: null
};
