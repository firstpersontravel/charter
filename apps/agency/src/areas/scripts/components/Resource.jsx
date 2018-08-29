import React from 'react';
import PropTypes from 'prop-types';

export default function Resource({ children, script }) {
  if (!script) {
    return <div>Loading!</div>;
  }
  return (
    <div>{children}</div>
  );
}

Resource.propTypes = {
  children: PropTypes.node.isRequired,
  script: PropTypes.object
};

Resource.defaultProps = {
  script: null
};
