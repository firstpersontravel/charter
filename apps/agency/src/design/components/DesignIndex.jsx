import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { browserHistory } from 'react-router';

function redirectIfReady(scripts) {
  const script = _(scripts)
    .filter({ isArchived: false })
    .sortBy('revision')
    .reverse()
    .head();
  if (script) {
    browserHistory.push(`/${script.org.name}/${script.experience.name}/script/${script.revision}/design`);
  }
}

export default class DesignIndex extends Component {
  componentWillMount() {
    redirectIfReady(this.props.scripts);
  }

  componentWillReceiveProps(nextProps) {
    redirectIfReady(nextProps.scripts);
  }

  render() {
    if (this.props.scripts.length === 0 && this.props.scripts.isLoading) {
      return <div className="container-fluid">Loading</div>;
    }
    if (this.props.scripts.isError) {
      return <div className="container-fluid">Error</div>;
    }
    return (
      <div className="container-fluid">
        Redirecting
      </div>
    );
  }
}

DesignIndex.propTypes = {
  scripts: PropTypes.array.isRequired
};
