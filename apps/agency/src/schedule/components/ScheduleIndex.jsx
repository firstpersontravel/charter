import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

export default function ScheduleIndex({ params }) {
  return (
    <div>
      <Link
        className="btn btn-block btn-primary"
        to={`/${params.orgName}/${params.experienceName}/schedule?group=new`}>
        Create a group
      </Link>
    </div>
  );
}

ScheduleIndex.propTypes = {
  params: PropTypes.object.isRequired
};
