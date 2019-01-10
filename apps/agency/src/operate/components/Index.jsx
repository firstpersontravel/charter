import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { browserHistory } from 'react-router';

export default class Index extends Component {
  componentWillMount() {
    if (this.props.groups.length) {
      browserHistory.push(
        `/${this.props.params.orgName}/${this.props.params.experienceName}` +
        `/operate/${this.props.groups[0].id}`
      );
    } else {
      browserHistory.push(
        `/${this.props.params.orgName}/${this.props.params.experienceName}`
      );
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.groups.length) {
      browserHistory.push(
        `/${this.props.params.orgName}/${this.props.params.experienceName}` +
        `/operate/${nextProps.groups[0].id}`
      );
    }
  }

  render() {
    return <div>Redirecting</div>;
  }
}

Index.propTypes = {
  params: PropTypes.object.isRequired,
  groups: PropTypes.array.isRequired
};
