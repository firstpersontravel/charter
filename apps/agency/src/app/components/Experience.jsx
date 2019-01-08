import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Nav from '../../partials/Nav';

export default class Experience extends Component {

  componentDidMount() {
    this.loadExperienceData(this.props.org, this.props.experienceName,
      this.props.experience);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.org !== this.props.org ||
        nextProps.experienceName !== this.props.experienceName) {
      this.loadExperienceData(nextProps.org, nextProps.experienceName,
        nextProps.experience);
    }
  }

  loadExperienceData(org, experienceName, experience) {
    if (!org) {
      return;
    }
    this.props.listCollection('experiences', {
      isArchived: false,
      orgId: org.id,
      name: experienceName
    });
    if (!experience) {
      return;
    }
    const filters = {
      isArchived: false,
      orgId: org.id,
      experienceId: experience.id
    };
    this.props.listCollection('groups', filters);
    this.props.listCollection('trips', filters);
    this.props.listCollection('scripts', filters);
    this.props.listCollection('profiles', filters);
    this.props.listCollection('users', { isArchived: false });
  }

  renderNav() {
    return (
      <Nav
        authInfo={this.props.authInfo}
        logout={this.props.logout}
        org={this.props.org}
        experience={this.props.experience} />
    );
  }

  renderErrorOrLoadingState() {
    let msg;
    if (!this.props.experienceRequest ||
        this.props.experienceRequest === 'pending') {
      msg = 'Loading...';
    } else if (this.props.experienceRequest === 'rejected') {
      msg = 'Error loading experience.';
    } else {
      msg = 'Experience not found.';
    }
    return (
      <div>
        {this.renderNav()}
        <div className="container-fluid">
          {msg}
        </div>
      </div>
    );
  }

  render() {
    if (!this.props.experience) {
      return this.renderErrorOrLoadingState();
    }
    return (
      <div>
        {this.renderNav()}
        {this.props.children}
      </div>
    );
  }
}

Experience.propTypes = {
  authInfo: PropTypes.object,
  children: PropTypes.node.isRequired,
  experienceRequest: PropTypes.string,
  experienceName: PropTypes.string.isRequired,
  experience: PropTypes.object,
  org: PropTypes.object,
  listCollection: PropTypes.func.isRequired,
  logout: PropTypes.func.isRequired
};

Experience.defaultProps = {
  experienceRequest: null,
  experience: null,
  org: null,
  authInfo: null
};
