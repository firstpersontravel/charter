import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';

function renderTabs(trip) {
  if (!trip || !trip.org || !trip.experience) {
    return null;
  }
  return (
    <ul className="nav nav-tabs">
      <li className="nav-item">
        <NavLink
          className="nav-link"
          activeClassName="active"
          to={`/${trip.org.name}/${trip.experience.name}/operate/trip/${trip.id}/scenes`}>
          Scenes
        </NavLink>
      </li>
      <li className="nav-item">
        <NavLink
          className="nav-link"
          activeClassName="active"
          to={`/${trip.org.name}/${trip.experience.name}/operate/trip/${trip.id}/values`}>
          Values
        </NavLink>
      </li>
      <li className="nav-item">
        <NavLink
          className="nav-link"
          activeClassName="active"
          to={`/${trip.org.name}/${trip.experience.name}/operate/trip/${trip.id}/schedule`}>
          Timing
        </NavLink>
      </li>
      <li className="nav-item">
        <NavLink
          className="nav-link"
          activeClassName="active"
          to={`/${trip.org.name}/${trip.experience.name}/operate/trip/${trip.id}/messages`}>
          Messages
        </NavLink>
      </li>
      <li className="nav-item">
        <NavLink
          className="nav-link"
          activeClassName="active"
          to={`/${trip.org.name}/${trip.experience.name}/operate/trip/${trip.id}/gallery`}>
          Gallery
        </NavLink>
      </li>
    </ul>
  );
}

export default function Trip({ trip, children }) {
  return (
    <div style={{ overflow: 'hidden' }}>
      {renderTabs(trip)}
      {children}
    </div>
  );
}

Trip.propTypes = {
  trip: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired
};
