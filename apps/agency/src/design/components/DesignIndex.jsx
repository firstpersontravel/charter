import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { Redirect } from 'react-router';
import { Link } from 'react-router-dom';

import Alert from '../../partials/Alert';
import Loader from '../../partials/Loader';

export default function DesignIndex({
  match, experience, scripts, history,
  updateInstance, isCreatingScript, isCreatingExperience
}) {
  if (scripts.isLoading
      || experience.isLoading
      || isCreatingScript
      || isCreatingExperience) {
    return <Loader />;
  }
  if (scripts.isError || experience.isError) {
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
        content="No script found for this project."
        action={(
          <span>
            <button
              className="btn btn-link"
              onClick={() => {
                updateInstance('experiences', experience.id, {
                  isArchived: true
                });
                history.push(`/${experience.org.name}`);
              }}>
              Archive project
            </button>
            <Link className="btn btn-link" to={`/${match.params.orgName}`}>
              Back
            </Link>
          </span>
        )} />
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
          `/${script.org.name}/${script.experience.name}/script/`
          + `${script.revision}/design`} />
    );
  }
  return (
    <div className="container-fluid">
      Redirecting
    </div>
  );
}

DesignIndex.propTypes = {
  isCreatingScript: PropTypes.bool.isRequired,
  isCreatingExperience: PropTypes.bool.isRequired,
  scripts: PropTypes.array.isRequired,
  experience: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  match: PropTypes.object.isRequired,
  updateInstance: PropTypes.func.isRequired
};
