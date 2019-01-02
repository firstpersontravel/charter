import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

import { EvalCore } from 'fptcore';

import { sortForRole } from '../utils';

export default function Trip({ params, tripStatus, children }) {
  if (tripStatus.isError) {
    return <div>Error - please refresh</div>;
  }
  if (!tripStatus.instance ||
    !tripStatus.instance.script) {
    return <div>Loading</div>;
  }
  const trip = tripStatus.instance;
  const roles = _(trip.script.content.roles)
    .filter(role => role.user)
    .filter(role => !role.if || EvalCore.if(trip.evalContext, role.if))
    .filter(role => (
      _.get(_.find(trip.players, { roleName: role.name }),
        'currentPageName')
    ))
    .sortBy([sortForRole, 'name'])
    .value();
  const roleLinks = roles.map((role => (
    <Link
      key={role.name}
      className="dropdown-item"
      to={`/operate/${params.groupId}/trip/${params.tripId}/players/${role.name}`}>
      {role.name}
    </Link>
  )));
  return (
    <div style={{ overflow: 'hidden' }}>
      <ul className="nav nav-tabs">
        <li className="nav-item">
          <Link
            className="nav-link"
            activeClassName="active"
            to={`/operate/${params.groupId}/trip/${params.tripId}/values`}>
            Prep
          </Link>
        </li>
        <li className="nav-item">
          <Link
            className="nav-link"
            activeClassName="active"
            to={`/operate/${params.groupId}/trip/${params.tripId}/schedule`}>
            Timing
          </Link>
        </li>
        <li className="nav-item">
          <Link
            className="nav-link"
            activeClassName="active"
            to={`/operate/${params.groupId}/trip/${params.tripId}/scenes`}>
            Scenes
          </Link>
        </li>
        <li className="nav-item dropdown">
          <Link
            className="nav-link dropdown-toggle"
            activeClassName="active"
            data-toggle="dropdown"
            to={`/operate/${params.groupId}/trip/${params.tripId}/players`}>
            Players
          </Link>
          <div className="dropdown-menu">
            {roleLinks}
          </div>
        </li>
        <li className="nav-item">
          <Link
            className="nav-link"
            activeClassName="active"
            to={`/operate/${params.groupId}/trip/${params.tripId}/achievements`}>
            Achievements
          </Link>
        </li>
        <li className="nav-item">
          <Link
            className="nav-link"
            activeClassName="active"
            to={`/operate/${params.groupId}/trip/${params.tripId}/controls`}>
            Controls
          </Link>
        </li>
        <li className="nav-item">
          <Link
            className="nav-link"
            activeClassName="active"
            to={`/operate/${params.groupId}/trip/${params.tripId}/gallery`}>
            Gallery
          </Link>
        </li>
      </ul>
      {children}
    </div>
  );
}

Trip.propTypes = {
  params: PropTypes.object.isRequired,
  tripStatus: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired
};
