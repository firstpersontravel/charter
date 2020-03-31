import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { Redirect } from 'react-router';
import { Link } from 'react-router-dom';

import Alert from '../../partials/Alert';
import Loader from '../../partials/Loader';

export default function DesignIndex({ match, scripts }) {
  if (scripts.isLoading) {
    return <Loader />;
  }
  if (scripts.isError) {
    return (
      <Alert
        color="danger"
        content="Error loading script."
        action={
          <Link to={`/${match.params.orgName}`}>Go back?</Link>
        } />
    );
  }
  if (scripts.length === 0) {
    return (
      <Alert
        color="warning"
        content="No script found for this experience."
        action={
          <Link to={`/${match.params.orgName}`}>Go back?</Link>
        } />
    );
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
  scripts: PropTypes.array.isRequired,
  match: PropTypes.object.isRequired
};
