import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

export default function Experience({ experienceName, experience, children }) {
  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-sm-12">
          <Link to="/design">Experiences</Link>
          &nbsp;&rsaquo;&nbsp;
          <Link to={`/design/experience/${experienceName}`}>
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
  children: PropTypes.node.isRequired
};

Experience.defaultProps = {
  experience: null
};
