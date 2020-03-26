import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { Redirect } from 'react-router';

import Loader from '../../partials/Loader';

export default function DesignIndex({ scripts }) {
  if (scripts.isLoading) {
    return <Loader />;
  }
  if (scripts.isError) {
    return <div className="container-fluid">Error</div>;
  }
  if (scripts.length === 0) {
    return <div className="container-fluid">No script found</div>;
  }
  const script = _(scripts)
    .filter({ isArchived: false })
    .sortBy('revision')
    .reverse()
    .head();
  if (script) {
    return (
      <Redirect
        to={
          `/${script.org.name}/${script.experience.name}/script/` +
          `${script.revision}/design`} />
    );
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
