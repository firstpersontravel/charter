import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { withLoader } from '../../loader-utils';

class Organization extends Component {
  renderOrgNotFound() {
    return (
      <div className="container-fluid">
        Organization not found.
      </div>
    );
  }

  render() {
    if (!this.props.org) {
      return this.renderOrgNotFound();
    }
    return this.props.children;
  }
}

Organization.propTypes = {
  children: PropTypes.node.isRequired,
  org: PropTypes.object
};

Organization.defaultProps = {
  org: null
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
