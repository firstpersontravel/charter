import React, { Component } from 'react';
import { Link } from 'react-router';
import PropTypes from 'prop-types';

import { getStage } from '../../utils';

function renderNav() {
  const stage = getStage();
  const stageLabel = stage !== 'production' ? stage.toUpperCase() : '';
  const navStageClass = `navbar-${stage}`;
  const navClass = `navbar navbar-expand-sm navbar-light bg-faded ${navStageClass}`;
  return (
    <nav className={navClass}>
      <Link activeClassName="active" className="navbar-brand" to="/agency">
        FPT&nbsp;{stageLabel}
      </Link>
      <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent">
        <span className="navbar-toggler-icon" />
      </button>
      <div className="collapse navbar-collapse" id="navbarSupportedContent">
        <ul className="navbar-nav mr-auto">
          <li className="nav-item">
            <Link activeClassName="active" className="nav-link" to="/agency/design">
              Design
            </Link>
          </li>
          <li className="nav-item">
            <Link activeClassName="active" className="nav-link" to="/agency/schedule">
              Schedule
            </Link>
          </li>
          <li className="nav-item">
            <Link activeClassName="active" className="nav-link" to="/agency/live">
              Operations
            </Link>
          </li>
          <li className="nav-item">
            <Link activeClassName="active" className="nav-link" to="/agency/users">
              Users
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default class App extends Component {

  componentDidMount() {
    document.title = `${getStage()} - FPT Ops`;
    this.props.listCollection('experiences', { isArchived: false });
    this.props.listCollection('groups', { isArchived: false });
    this.props.listCollection('trips', { isArchived: false });
    this.props.listCollection('scripts', { isArchived: false });
    this.props.listCollection('profiles');
    this.props.listCollection('users');
  }

  render() {
    return (
      <div>
        {renderNav()}
        {this.props.children}
      </div>
    );
  }
}

App.propTypes = {
  children: PropTypes.node.isRequired,
  listCollection: PropTypes.func.isRequired
};
