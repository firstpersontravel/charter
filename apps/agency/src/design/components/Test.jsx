import React from 'react';
import PropTypes from 'prop-types';

export default function Test({ script }) {
  return (
    <span>
      testing!
    </span>
  );
}

Test.propTypes = {
  script: PropTypes.object.isRequired
};
