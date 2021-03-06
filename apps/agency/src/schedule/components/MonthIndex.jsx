import moment from 'moment-timezone';
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

export default function MonthIndex({ match, org, experience }) {
  const d = moment(`${match.params.year}-${match.params.month}-01`, 'YYYY-MM-DD');
  return (
    <div>
      <Link
        className="btn btn-block btn-primary"
        to={`/${match.params.orgName}/${match.params.experienceName}/schedule/${match.params.year}/${match.params.month}?group=new`}>
        Schedule a run group in {d.format('MMMM YYYY')}
      </Link>
    </div>
  );
}

MonthIndex.propTypes = {
  match: PropTypes.object.isRequired,
  org: PropTypes.object.isRequired,
  experience: PropTypes.object.isRequired
};
