import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

export default function Trip({ trip, params, children }) {
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
        <li className="nav-item">
          <Link
            className="nav-link"
            activeClassName="active"
            to={`/${trip.org.name}/${trip.experience.name}/operate/${trip.groupId}/trip/${trip.id}/messages`}>
            Messages
          </Link>
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
