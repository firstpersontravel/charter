import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

export default function MonthIndex({ match }) {
  return (
    <div className="d-grid">
      <Link
        className="btn btn-primary"
        to={`/${match.params.orgName}/${match.params.experienceName}/schedule/${match.params.year}/${match.params.month}?trip=new`}>
        New run
      </Link>
    </div>
  );
}

MonthIndex.propTypes = {
  match: PropTypes.object.isRequired
};
