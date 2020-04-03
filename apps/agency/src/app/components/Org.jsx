import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Nav from '../../partials/Nav';
import { withLoader } from '../../loader-utils';

class Organization extends Component {
  renderNav() {
    return (
      <Nav
        authInfo={this.props.authInfo}
        org={this.props.org}
        experiences={this.props.experiences} />
    );
  }

  renderOrgNotFound() {
    return (
      <div>
        {this.renderNav()}
        <div className="container-fluid">
          Organization not found.
        </div>
      </div>
    );
  }

  render() {
    if (!this.props.org) {
      return this.renderOrgNotFound();
    }
    return (
      <div>
        {this.renderNav()}
        {this.props.children}
      </div>
    );
  }
}

Organization.propTypes = {
  authInfo: PropTypes.object,
  children: PropTypes.node.isRequired,
  experiences: PropTypes.array.isRequired,
  org: PropTypes.object
};

Organization.defaultProps = {
  org: null,
  authInfo: null
};

export default withLoader(Organization, ['org.id'], (props) => {
  if (!props.org) {
    return;
  }
  props.listCollection('experiences', {
    isArchived: false,
    orgId: props.org.id
  });
});
