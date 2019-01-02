import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { browserHistory } from 'react-router';

export default class Index extends Component {
  componentWillMount() {
    if (this.props.groupId) {
      browserHistory.push(`/operate/${this.props.groupId}`);
    } else {
      browserHistory.push('/');
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.groupId) {
      browserHistory.push(`/operate/${nextProps.groupId}`);
    }
  }

  render() {
    return <div>Redirecting</div>;
  }
}

Index.propTypes = {
  groupId: PropTypes.number
};

Index.defaultProps = {
  groupId: null
};
