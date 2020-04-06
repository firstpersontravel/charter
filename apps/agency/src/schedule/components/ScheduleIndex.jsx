import moment from 'moment-timezone';
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

export default function ScheduleIndex({ match }) {
  const d = moment(`${match.params.year}-${match.params.month}-01`, 'YYYY-MM-DD');
  return (
    <div>
      <Link
        className="btn btn-block btn-primary"
        to={`/${match.params.orgName}/${match.params.experienceName}/schedule/${match.params.year}/${match.params.month}?group=new`}>
        Create {d.format('MMMM')} block
      </Link>
    </div>
  );
}

ScheduleIndex.propTypes = {
  match: PropTypes.object.isRequired
};
