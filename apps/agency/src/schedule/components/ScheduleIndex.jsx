import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

export default function ScheduleIndex({ match }) {
  return (
    <div>
      <Link
        className="btn btn-block btn-primary"
        to={`/${match.params.orgName}/${match.params.experienceName}/schedule/${match.params.year}/${match.params.month}?group=new`}>
        Create a block
      </Link>
    </div>
  );
}

ScheduleIndex.propTypes = {
  match: PropTypes.object.isRequired
};
