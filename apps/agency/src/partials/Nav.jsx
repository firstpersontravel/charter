import _ from 'lodash';
import React from 'react';
import moment from 'moment';
import { NavLink, Link } from 'react-router-dom';
import PropTypes from 'prop-types';

import { getStage } from '../utils';

const globalTitle = 'Charter';

function titleForOrg(org) {
  return org.isPersonal ? 'Home' : org.title;
}

function renderRight(authInfo) {
  if (!authInfo || !authInfo.user) {
    return (
      <ul className="navbar-nav ml-auto">
        <li className="nav-item">
          <Link className="btn btn-primary" to="/login">
            Login
          </Link>
        </li>
      </ul>
    );
  }

  const orgLinks = (authInfo.orgs || []).map(org => (
    <Link
      key={org.id}
      className="btn btn-link dropdown-item"
      to={`/${org.name}`}>
      {org.title}
    </Link>
  ));

  return (
    <ul className="navbar-nav ml-auto">
      <li className="nav-item">
        <div className="dropdown">
          <button className="btn btn-unstyled dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            <i className="fa fa-user" />
          </button>
          <div className="dropdown-menu dropdown-menu-right" aria-labelledby="dropdownMenuButton">
            {orgLinks}
            <Link className="btn btn-link dropdown-item" to="/logout">
              Log out
            </Link>
          </div>
        </div>
      </li>
    </ul>
  );
}

function renderBrand(org, experience) {
  const inkwellStyle = {
    height: '1.2em',
    top: '-.3em',
    position: 'relative',
    marginRight: '.2em'
  };
  const inkwell = (
    <img
      style={inkwellStyle}
      alt="First Person Travel logo"
      src="/static/images/logo-03.png" />
  );
  if (!org) {
    return (
      <NavLink
        key="main"
        activeClassName="active"
        className="navbar-brand mr-1"
        to="/">
        {inkwell}
        {globalTitle.toUpperCase()}
      </NavLink>
    );
  }
  return (
    <NavLink
      key="org"
      activeClassName="active"
      className="navbar-brand mr-1"
      to={`/${org.name}`}>
      {inkwell}
      {titleForOrg(org).toUpperCase()}
    </NavLink>
  );
}

function renderMenu(org, experience, experiences, groups, groupId) {
  const experienceLinks = experiences.map(exp => (
    <Link
      key={exp.id}
      className="btn btn-link dropdown-item"
      to={`/${org.name}/${exp.name}`}>
      {exp.title}
    </Link>
  ));

  const experienceDropdown = experiences.length > 0 ? (
    <li className="nav-item dropdown">
      <div
        style={{ cursor: 'pointer' }}
        className="bold nav-link dropdown-toggle constrain-text"
        id="experiencesDropdown"
        data-toggle="dropdown">
        {experience ? experience.title : 'Experiences'}
      </div>
      <div className="dropdown-menu" aria-labelledby="experiencesDropdown">
        {experienceLinks}
      </div>
    </li>
  ) : null;

  if (!org || !experience) {
    return (
      <ul className="navbar-nav mr-auto">
        {experienceDropdown}
      </ul>
    );
  }

  const groupLinks = groups
    .filter(group => group.trips.length > 0)
    .map(group => (
      <Link
        key={group.id}
        className="btn btn-link dropdown-item"
        to={`/${org.name}/${experience.name}/operate/${group.id}`}>
        {moment.utc(group.date).format('MMM D, YYYY')}
      </Link>
    ));

  const activeGroup = window.location.pathname.indexOf('operate') > 0 &&
    _.find(groups, { id: Number(groupId) });

  const opsTitle = activeGroup ?
    `Ops: ${moment.utc(activeGroup.date).format('MMM D')}` :
    'Ops';
  const opsDropdown = groupLinks.length > 0 ? (
    <li className="nav-item dropdown">
      <NavLink
        style={{ cursor: 'pointer' }}
        id="opsDropdown"
        data-toggle="dropdown"
        activeClassName="active"
        className={`dropdown-toggle nav-link constrain-text ${activeGroup ? 'active' : ''}`}
        to={`/${org.name}/${experience.name}/operate`}>
        {opsTitle}
      </NavLink>
      <div className="dropdown-menu" aria-labelledby="opsDropdown">
        {groupLinks}
      </div>
    </li>
  ) : null;

  return (
    <ul className="navbar-nav mr-auto">
      {experienceDropdown}
      <li className="nav-item">
        <NavLink
          activeClassName="active"
          className="nav-link"
          to={`/${org.name}/${experience.name}/script`}>
          Script
        </NavLink>
      </li>
      <NavLink
        activeClassName="active"
        className="nav-link"
        to={`/${org.name}/${experience.name}/schedule`}>
        Entry
      </NavLink>
      {opsDropdown}
      <li className="nav-item">
        <NavLink
          activeClassName="active"
          className="nav-link"
          to={`/${org.name}/${experience.name}/directory`}>
          Users
        </NavLink>
      </li>
    </ul>
  );
}

export default function Nav({ authInfo, org, experience, experiences, groups,
  groupId }) {
  const orgTitle = org ? org.title : globalTitle;
  document.title = `${orgTitle}`;
  const stage = getStage();
  const navStageClass = `navbar-${stage}`;
  const navClass = `navbar navbar-expand-sm navbar-light navbar-faded ${navStageClass}`;

  return (
    <nav className={navClass}>
      {renderBrand(org, experience)}
      <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent">
        <span className="navbar-toggler-icon" />
      </button>
      <div className="collapse navbar-collapse" id="navbarSupportedContent">
        {renderMenu(org, experience, experiences, groups, groupId)}
      </div>
      <div className="navbar-collapse collapse w-100 order-3">
        {renderRight(authInfo)}
      </div>
    </nav>
  );
}

Nav.propTypes = {
  authInfo: PropTypes.object,
  org: PropTypes.object,
  experience: PropTypes.object,
  experiences: PropTypes.array,
  groups: PropTypes.array,
  groupId: PropTypes.string
};

Nav.defaultProps = {
  authInfo: null,
  org: null,
  experience: null,
  experiences: [],
  groups: [],
  groupId: null
};
