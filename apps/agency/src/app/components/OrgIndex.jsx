import React from 'react';
import PropTypes from 'prop-types';

import ExperienceList from '../partials/ExperienceList';

export default function OrgIndex({ location, org, experiences, createInstance }) {
  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-sm-3">
          <ExperienceList
            location={location}
            org={org}
            experiences={experiences}
            createInstance={createInstance} />
        </div>
        <div className="col-sm-9">
          ...
        </div>
      </div>
    </div>
  );
}

OrgIndex.propTypes = {
  location: PropTypes.object.isRequired,
  org: PropTypes.object.isRequired,
  experiences: PropTypes.array.isRequired,
  createInstance: PropTypes.func.isRequired
};
