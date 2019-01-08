import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Nav from '../../partials/Nav';

export default class Organization extends Component {

  componentDidMount() {
    this.loadOrgData(this.props.org);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.org !== this.props.org) {
      this.loadOrgData(nextProps.org);
    }
  }

  loadOrgData(org) {
    if (!org) {
      return;
    }
    const filters = { isArchived: false, orgId: org.id };
    this.props.listCollection('experiences', filters);
  }

  renderNav() {
    return (
      <Nav
        authInfo={this.props.authInfo}
        logout={this.props.logout}
        org={this.props.org} />
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
  org: PropTypes.object,
  listCollection: PropTypes.func.isRequired,
  logout: PropTypes.func.isRequired
};

Organization.defaultProps = {
  org: null,
  authInfo: null
};
