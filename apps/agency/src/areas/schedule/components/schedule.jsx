import React from 'react';
import PropTypes from 'prop-types';

export default function Schedule({ scripts, children }) {
  if (!scripts || !scripts.length) {
    return <div>Loading</div>;
  }
  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-sm-12">
          {children}
        </div>
      </div>
    </div>
  );
}

Schedule.propTypes = {
  children: PropTypes.node.isRequired,
  scripts: PropTypes.array
};

Schedule.defaultProps = {
  scripts: null
};
