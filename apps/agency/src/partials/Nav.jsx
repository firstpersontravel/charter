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

function renderBrand(org) {
  const name = org ?
    `MULTIVERSE | ${org.title.toUpperCase()}` :
    'MULTIVERSE';
  return (
    <Link
      activeClassName="active"
      className="navbar-brand"
      to={org ? `/${org.name}` : '/'}>
      {name}
    </Link>
  );
}

function renderMenu(org) {
  if (!org) {
    return null;
  }
  return (
    <ul className="navbar-nav mr-auto">
      <li className="nav-item">
        <Link
          activeClassName="active"
          className="nav-link"
          to={`/${org.name}/design`}>
          Design
        </Link>
      </li>
      <li className="nav-item">
        <Link
          activeClassName="active"
          className="nav-link"
          to={`/${org.name}/schedule`}>
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

export default function Nav({ authInfo, logout, org }) {
  document.title = `${getStage()} - FPT Ops`;
  const stage = getStage();
  const navStageClass = `navbar-${stage}`;
  const navClass = `navbar navbar-expand-sm navbar-light bg-faded ${navStageClass}`;

  return (
    <nav className={navClass}>
      {renderBrand(org)}
      <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent">
        <span className="navbar-toggler-icon" />
      </button>
      <div className="collapse navbar-collapse" id="navbarSupportedContent">
        {renderMenu(org)}
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
  org: PropTypes.object
};

Nav.defaultProps = {
  authInfo: null,
  org: null
};
