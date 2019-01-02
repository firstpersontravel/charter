import React, { Component } from 'react';
import { Link } from 'react-router';
import PropTypes from 'prop-types';

import { getStage } from '../../utils';

function renderNav(authInfo, logout) {
  const stage = getStage();
  const navStageClass = `navbar-${stage}`;
  const navClass = `navbar navbar-expand-sm navbar-light bg-faded ${navStageClass}`;

  if (!authInfo) {
    return (
      <nav className={navClass}>
        <Link activeClassName="active" className="navbar-brand" to="/">
          FPT MULTIVERSE
        </Link>
        <div className="navbar-collapse collapse w-100 order-3">
          <ul className="navbar-nav ml-auto">
            <li className="nav-item">
              <Link activeClassName="" className="btn btn-primary" to="/login">
                Login
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    );
  }

  return (
    <nav className={navClass}>
      <Link activeClassName="active" className="navbar-brand" to="/">
        FPT MULTIVERSE
      </Link>
      <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent">
        <span className="navbar-toggler-icon" />
      </button>
      <div className="collapse navbar-collapse" id="navbarSupportedContent">
        <ul className="navbar-nav mr-auto">
          <li className="nav-item">
            <Link activeClassName="active" className="nav-link" to="/design">
              Design
            </Link>
          </li>
          <li className="nav-item">
            <Link activeClassName="active" className="nav-link" to="/schedule">
              Schedule
            </Link>
          </li>
          <li className="nav-item">
            <Link activeClassName="active" className="nav-link" to="/operate">
              Operate
            </Link>
          </li>
          <li className="nav-item">
            <Link activeClassName="active" className="nav-link" to="/users">
              Users
            </Link>
          </li>
        </ul>
      </div>
      <div className="navbar-collapse collapse w-100 order-3">
        <ul className="navbar-nav ml-auto">
          <li className="nav-item">
            <button
              className="btn btn-link nav-link"
              onClick={() => logout()}>
              Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default class App extends Component {

  componentDidMount() {
    document.title = `${getStage()} - FPT Ops`;
    this.props.fetchAuthInfo();
    this.props.listCollection('experiences', { isArchived: false });
    this.props.listCollection('groups', { isArchived: false });
    this.props.listCollection('trips', { isArchived: false });
    this.props.listCollection('scripts', { isArchived: false });
    this.props.listCollection('profiles');
    this.props.listCollection('users');
  }

  renderContent() {
    return this.props.children;
  }

  render() {
    return (
      <div>
        {renderNav(this.props.authInfo, this.props.logout)}
        {this.renderContent()}
      </div>
    );
  }
}

App.propTypes = {
  authInfo: PropTypes.object,
  children: PropTypes.node.isRequired,
  fetchAuthInfo: PropTypes.func.isRequired,
  listCollection: PropTypes.func.isRequired,
  logout: PropTypes.func.isRequired
};

App.defaultProps = {
  authInfo: null
};
