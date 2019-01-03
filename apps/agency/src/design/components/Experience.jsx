import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

export default function Experience({ experienceName, experience, children, params }) {
  const organizationName = params.organizationName;
  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-sm-12">
          <Link to="/design">Experiences</Link>
          &nbsp;&rsaquo;&nbsp;
          <Link to={`/${organizationName}/design/experience/${experienceName}`}>
            {experience && experience.title}
          </Link>
        </div>
      </div>
      <hr />
      {children}
    </div>
  );
}

Experience.propTypes = {
  experienceName: PropTypes.string.isRequired,
  experience: PropTypes.object,
  children: PropTypes.node.isRequired,
  params: PropTypes.object.isRequired
};

Experience.defaultProps = {
  experience: null
};
