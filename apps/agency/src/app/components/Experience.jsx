import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import Alert from '../../partials/Alert';
import Loader from '../../partials/Loader';
import { withLoader } from '../../loader-utils';

class Experience extends Component {
  renderMsg() {
    if (!this.props.experience && this.props.experienceRequest === 'pending') {
      return <Loader />;
    }
    if (this.props.experienceRequest === 'rejected') {
      return <Alert color="danger" content="Error loading experience." />;
    }
    if (!this.props.experience) {
      return (
        <Alert
          color="warning"
          content="Project not found."
          action={
            <Link to={`/${this.props.match.params.orgName}`}>Go back?</Link>
          } />
      );
    }
    return null;
  }

  render() {
    // Render error or loading state
    const msg = this.renderMsg();
    if (msg) {
      return (
        <div className="container-fluid">
          {msg}
        </div>
      );
    }
    // Render normal state
    return this.props.children;
  }
}

Experience.propTypes = {
  children: PropTypes.node.isRequired,
  experienceRequest: PropTypes.string,
  experience: PropTypes.object,
  match: PropTypes.object.isRequired
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
  props.listCollection('trips', filters);
  props.listCollection('scripts', filters);
  props.listCollection('profiles', filters);
  props.listCollection('participants', filters);
});
