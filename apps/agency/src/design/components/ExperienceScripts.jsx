import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

export default function ExperienceScripts({ experienceName, experience, scripts, params }) {
  if (!scripts.length) {
    return <div>Loading!</div>;
  }
  const organizationName = params.organizationName;
  const renderedScripts = scripts.map(script => (
    <div key={script.id}>
      <Link
        to={
          `/${organizationName}/design/script/${script.id}`
        }>
        Rev. {script.revision}
      </Link>
    </div>
  ));
  return (
    <div className="row">
      <div className="col-sm-6">
        {renderedScripts}
      </div>
      <div className="col-sm-6">
        <Link to={`/${organizationName}/design/experience/${experienceName}/relays`}>
          Relays
        </Link>
      </div>
    </div>
  );
}

ExperienceScripts.propTypes = {
  experienceName: PropTypes.string.isRequired,
  experience: PropTypes.object,
  scripts: PropTypes.array.isRequired,
  params: PropTypes.object.isRequired
};

ExperienceScripts.defaultProps = {
  experience: null
};
