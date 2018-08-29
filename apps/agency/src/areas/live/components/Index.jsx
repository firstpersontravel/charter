import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { browserHistory } from 'react-router';

export default class Index extends Component {
  componentWillMount() {
    if (this.props.groupId) {
      browserHistory.push(`/agency/live/${this.props.groupId}`);
    } else {
      browserHistory.push('/agency/');
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.groupId) {
      browserHistory.push(`/agency/live/${nextProps.groupId}`);
    }
  }

  render() {
    return <div>Redirecting</div>;
  }
}

Index.propTypes = {
  groupId: PropTypes.number.isRequired
};
