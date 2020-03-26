import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Nav from '../../partials/Nav';
import Loader from '../../partials/Loader';
import { withLoader } from '../../loader-utils';

class Experience extends Component {
  renderNav() {
    const path = this.props.history.location.pathname;
    const match = path.match(/operate\/(\d+)/);
    const groupId = match ? match[1] : null;
    return (
      <Nav
        authInfo={this.props.authInfo}
        logout={this.props.logout}
        org={this.props.org}
        experience={this.props.experience}
        experiences={this.props.experiences}
        groups={this.props.groups}
        groupId={groupId} />
    );
  }

  renderMsg() {
    if (!this.props.experience && this.props.experienceRequest === 'pending') {
      return <Loader />;
    }
    if (this.props.experienceRequest === 'rejected') {
      return (
        <div className="alert alert-danger">
          Error loading experience.
        </div>
      );
    }
    if (!this.props.experience) {
      return (
        <div className="alert alert-warning">
          Experience not found.
          &nbsp;
          <a href={`/${this.props.match.params.orgName}`}>Go back</a>
        </div>
      );
    }
    return null;
  }

  render() {
    // Render error or loading state
    const msg = this.renderMsg();
    if (msg) {
      return (
        <div>
          {this.renderNav()}
          <div className="container-fluid">
            {msg}
          </div>
        </div>
      );
    }
    // Render normal state
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
  experience: PropTypes.object,
  experiences: PropTypes.array.isRequired,
  groups: PropTypes.array.isRequired,
  org: PropTypes.object,
  match: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  logout: PropTypes.func.isRequired
};

Experience.defaultProps = {
  experienceRequest: null,
  experience: null,
  org: null,
  authInfo: null
};

export default withLoader(Experience, ['org.id', 'experience.id'], (props) => {
  if (!props.org) {
    return;
  }
  props.listCollection('experiences', {
    isArchived: false,
    orgId: props.org.id
  });
  if (!props.experience) {
    return;
  }
  const filters = {
    isArchived: false,
    orgId: props.org.id,
    experienceId: props.experience.id
  };
  props.listCollection('groups', filters);
  props.listCollection('trips', filters);
  props.listCollection('scripts', filters);
  props.listCollection('profiles', filters);
  props.listCollection('users', filters);
});
