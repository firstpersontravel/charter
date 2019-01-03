import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { browserHistory } from 'react-router';

export default class Index extends Component {
  componentWillMount() {
    const organizationName = this.props.params.organizationName;
    if (this.props.groupId) {
      browserHistory.push(`/${organizationName}/operate/${this.props.groupId}`);
    } else {
      browserHistory.push(`/${organizationName}/schedule`);
    }
  }

  componentWillReceiveProps(nextProps) {
    const organizationName = this.props.params.organizationName;
    if (nextProps.groupId) {
      browserHistory.push(`/${organizationName}/operate/${nextProps.groupId}`);
    }
  }

  render() {
    return <div>Redirecting</div>;
  }
}

Index.propTypes = {
  params: PropTypes.object.isRequired,
  groupId: PropTypes.number
};

Index.defaultProps = {
  groupId: null
};
