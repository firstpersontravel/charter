import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { browserHistory } from 'react-router';

export default class Index extends Component {
  componentWillMount() {
    if (this.props.groups.length) {
      const group = this.props.groups[this.props.groups.length - 1];
      browserHistory.push(
        `/${this.props.params.orgName}/${this.props.params.experienceName}` +
        `/operate/${group.id}`
      );
    } else {
      browserHistory.push(
        `/${this.props.params.orgName}/${this.props.params.experienceName}`
      );
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.groups.length) {
      const group = nextProps.groups[nextProps.groups.length - 1];
      browserHistory.push(
        `/${this.props.params.orgName}/${this.props.params.experienceName}` +
        `/operate/${group.id}`
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
