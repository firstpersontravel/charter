import React from 'react';
import { Link } from 'react-router';
import PropTypes from 'prop-types';

import { getStage } from '../utils';

function renderRight(authInfo, logout) {
  if (!authInfo) {
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
  return (
    <ul className="navbar-nav ml-auto">
      <li className="nav-item">
        <button
          className="btn btn-link nav-link"
          onClick={() => logout()}>
          Logout
        </button>
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
  const brands = [
    <Link
      key="org"
      activeClassName="active"
      className="navbar-brand"
      style={{ marginRight: '0.25rem' }}
      to={`/${org.name}`}>
      {org.title.toUpperCase()}
    </Link>
  ];
  if (experience) {
    brands.push(
      <span
        key="expspacer"
        className="navbar-brand"
        style={{ marginRight: '0.25rem' }}>
        |
      </span>,
      <Link
        key="exp"
        activeClassName="active"
        className="navbar-brand"
        style={{ marginRight: '0.25rem' }}
        to={`/${org.name}/${experience.name}`}>
        {experience.title.toUpperCase()}
      </Link>
    );
  }
  return brands;
}

function renderMenu(org, experience) {
  if (!org || !experience) {
    return null;
  }
  return (
    <ul className="navbar-nav mr-auto">
      <li className="nav-item">
        <Link
          activeClassName="active"
          className="nav-link"
          to={`/${org.name}/${experience.name}/design`}>
          Design
        </Link>
      </li>
      <li className="nav-item">
        <Link
          activeClassName="active"
          className="nav-link"
          to={`/${org.name}/${experience.name}/schedule`}>
          Schedule
        </Link>
      </li>
      <li className="nav-item">
        <Link
          activeClassName="active"
          className="nav-link"
          to={`/${org.name}/operate`}>
          Operate
        </Link>
      </li>
      <li className="nav-item">
        <Link
          activeClassName="active"
          className="nav-link"
          to={`/${org.name}/directory`}>
          Directory
        </Link>
      </li>
    </ul>
  );
}

export default function Nav({ authInfo, logout, org, experience }) {
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
        {renderMenu(org, experience)}
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
  experience: PropTypes.object
};

Nav.defaultProps = {
  authInfo: null,
  org: null,
  experience: null
};
