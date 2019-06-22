import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

import { Evaluator, Registry } from 'fptcore';

import { sortForRole, canRoleHaveUser } from '../utils';

const evaluator = new Evaluator(Registry);

export default function Trip({ trip, params, children }) {
  if (!trip.script) {
    return null;
  }
  const roles = _(trip.script.content.roles)
    .filter(role => canRoleHaveUser(role))
    .filter(role => evaluator.if(trip.evalContext, role.active_if))
    .sortBy([sortForRole, 'name'])
    .value();
  const roleLinks = roles.map((role => (
    <Link
      key={role.name}
      className="dropdown-item"
      to={`/${trip.org.name}/${trip.experience.name}/operate/${trip.groupId}/trip/${trip.id}/players/${role.name}`}>
      {role.title}
    </Link>
  )));
  let playerTitle = 'Players';
  if (params.roleName) {
    const role = _.find(trip.script.content.roles, { name: params.roleName });
    playerTitle = `Player: ${role.title}`;
  }
  return (
    <div style={{ overflow: 'hidden' }}>
      <ul className="nav nav-tabs">
        <li className="nav-item">
          <Link
            className="nav-link"
            activeClassName="active"
            to={`/${trip.org.name}/${trip.experience.name}/operate/${trip.groupId}/trip/${trip.id}/values`}>
            Prep
          </Link>
        </li>
        <li className="nav-item">
          <Link
            className="nav-link"
            activeClassName="active"
            to={`/${trip.org.name}/${trip.experience.name}/operate/${trip.groupId}/trip/${trip.id}/schedule`}>
            Timing
          </Link>
        </li>
        <li className="nav-item">
          <Link
            className="nav-link"
            activeClassName="active"
            to={`/${trip.org.name}/${trip.experience.name}/operate/${trip.groupId}/trip/${trip.id}/scenes`}>
            Scenes
          </Link>
        </li>
        <li className="nav-item dropdown">
          <Link
            className="nav-link dropdown-toggle"
            activeClassName="active"
            data-toggle="dropdown"
            to={`/${trip.org.name}/${trip.experience.name}/operate/${trip.groupId}/trip/${trip.id}/players`}>
            {playerTitle}
          </Link>
          <div className="dropdown-menu">
            {roleLinks}
          </div>
        </li>
        <li className="nav-item">
          <Link
            className="nav-link"
            activeClassName="active"
            to={`/${trip.org.name}/${trip.experience.name}/operate/${trip.groupId}/trip/${trip.id}/achievements`}>
            Achievements
          </Link>
        </li>
        <li className="nav-item">
          <Link
            className="nav-link"
            activeClassName="active"
            to={`/${trip.org.name}/${trip.experience.name}/operate/${trip.groupId}/trip/${trip.id}/controls`}>
            Controls
          </Link>
        </li>
        <li className="nav-item">
          <Link
            className="nav-link"
            activeClassName="active"
            to={`/${trip.org.name}/${trip.experience.name}/operate/${trip.groupId}/trip/${trip.id}/gallery`}>
            Gallery
          </Link>
        </li>
      </ul>
      {children}
    </div>
  );
}

Trip.propTypes = {
  trip: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired
};
