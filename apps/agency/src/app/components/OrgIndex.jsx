import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

export default function OrgIndex({ experiences }) {
  if (experiences.isLoading) {
    return (
      <div className="container-fluid">Loading</div>
    );
  }
  if (experiences.isError) {
    return (
      <div className="container-fluid">Error</div>
    );
  }
  const renderedExperiences = experiences.map(experience => (
    <div key={experience.id}>
      <Link to={`/${experience.org.name}/${experience.name}`}>
        {experience.title}
      </Link>
    </div>
  ));
  return (
    <div className="container-fluid">
      {renderedExperiences}
    </div>
  );
}

OrgIndex.propTypes = {
  experiences: PropTypes.array.isRequired
};
