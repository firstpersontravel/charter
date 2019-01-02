import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

function renderExperience(experience, scripts) {
  const scriptItems = scripts.map(script => (
    <div key={`${experience.id}-${script.id}`}>
      <Link
        to={`/agency/design/script/${script.id}`}>
        {experience.title} Rev {script.revision}
      </Link>
    </div>
  ));
  return (
    <div key={experience.id}>
      <h4>{experience.title}</h4>
      {scriptItems}
      <Link
        to={`/agency/design/experience/${experience.name}/relays`}>
        Relays
      </Link>
    </div>
  );
}

export default function ExperiencesIndex({ children, experiences, scripts }) {
  const experienceItems = experiences.map(experience => (
    renderExperience(experience, _.filter(scripts, {
      experienceId: experience.id
    }))
  ));
  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-sm-12">
          <Link to="/agency/design">Experiences</Link>
        </div>
      </div>
      <hr />
      {experienceItems}
    </div>
  );
}

ExperiencesIndex.propTypes = {
  children: PropTypes.node,
  experiences: PropTypes.array.isRequired,
  scripts: PropTypes.array.isRequired
};

ExperiencesIndex.defaultProps = {
  children: null
};
