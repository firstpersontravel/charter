import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { browserHistory } from 'react-router';

export default class Index extends Component {
  componentWillMount() {
    const orgName = this.props.params.orgName;
    if (this.props.groupId) {
      browserHistory.push(`/${orgName}/operate/${this.props.groupId}`);
    } else {
      browserHistory.push(`/${orgName}/schedule`);
    }
  }

  componentWillReceiveProps(nextProps) {
    const orgName = this.props.params.orgName;
    if (nextProps.groupId) {
      browserHistory.push(`/${orgName}/operate/${nextProps.groupId}`);
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
