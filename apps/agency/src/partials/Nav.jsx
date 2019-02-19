import React from 'react';
import { Link } from 'react-router';
import PropTypes from 'prop-types';

import { getStage } from '../utils';

function renderRight(authInfo, logout) {
  if (!authInfo || !authInfo.user) {
    return (
      <ul className="navbar-nav ml-auto">
        <li className="nav-item">
          <Link activeClassName="" className="btn btn-primary" to="/login">
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
            {authInfo.user.email}
          </button>
          <div className="dropdown-menu dropdown-menu-right" aria-labelledby="dropdownMenuButton">
            {orgLinks}
            <button
              className="btn btn-link dropdown-item"
              onClick={() => logout()}>
              Logout
            </button>
          </div>
        </div>
      </li>
    </ul>
  );
}

function renderBrand(org, experience) {
  if (!org) {
    return (
      <Link
        key="main"
        activeClassName="active"
        className="navbar-brand"
        style={{ marginRight: '0.25rem' }}
        to="/">
        MULTIVERSE
      </Link>
    );
  }
  return (
    <Link
      key="org"
      activeClassName="active"
      className="navbar-brand"
      style={{ marginRight: '0.25rem' }}
      to={`/${org.name}`}>
      {org.title.toUpperCase()}
    </Link>
  );
}

function renderMenu(org, experience, experiences) {
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
        className="text-dark bold nav-link dropdown-toggle constrain-text"
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
  return (
    <ul className="navbar-nav mr-auto">
      {experienceDropdown}
      <li className="nav-item">
        <Link
          activeClassName="active"
          className="nav-link"
          to={`/${org.name}/${experience.name}/script`}>
          Script
        </Link>
      </li>
      <li className="nav-item">
        <Link
          activeClassName="active"
          className="nav-link"
          to={`/${org.name}/${experience.name}/operate`}>
          Operations
        </Link>
      </li>
      <li className="nav-item">
        <Link
          activeClassName="active"
          className="nav-link"
          to={`/${org.name}/${experience.name}/directory`}>
          Users
        </Link>
      </li>
    </ul>
  );
}

export default function Nav({
  authInfo, logout, org, experience, experiences
}) {
  document.title = `${getStage()} - FPT Ops`;
  const stage = getStage();
  const navStageClass = `navbar-${stage}`;
  const navClass = `navbar navbar-expand-sm navbar-light bg-faded ${navStageClass}`;

  return (
    <nav className={navClass}>
      {renderBrand(org, experience)}
      <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent">
        <span className="navbar-toggler-icon" />
      </button>
      <div className="collapse navbar-collapse" id="navbarSupportedContent">
        {renderMenu(org, experience, experiences)}
      </div>
      <div className="navbar-collapse collapse w-100 order-3">
        {renderRight(authInfo, logout)}
      </div>
    </nav>
  );
}

Nav.propTypes = {
  authInfo: PropTypes.object,
  logout: PropTypes.func.isRequired,
  org: PropTypes.object,
  experience: PropTypes.object,
  experiences: PropTypes.array
};

Nav.defaultProps = {
  authInfo: null,
  org: null,
  experience: null,
  experiences: []
};
