import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { browserHistory } from 'react-router';

export default function DesignIndex({ scripts }) {
  if (scripts.isLoading) {
    return <div className="container-fluid">Loading</div>;
  }
  if (scripts.isError) {
    return <div className="container-fluid">Error</div>;
  }
  const script = _.find(scripts, { isActive: true });
  if (script) {
    browserHistory.push(`/${script.org.name}/${script.experience.name}/design/script/${script.id}`);
  }
  return (
    <div className="container-fluid">
      Redirecting
    </div>
  );
}

DesignIndex.propTypes = {
  scripts: PropTypes.array.isRequired
};
