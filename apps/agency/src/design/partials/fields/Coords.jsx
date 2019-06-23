import React from 'react';
import PropTypes from 'prop-types';

import BaseString from './BaseString';

function CoordsField({ spec, value, name, path, opts, onPropUpdate }) {
  const clean = val => val.split(',').map(v => Number(v));
  return (
    <BaseString
      spec={spec}
      value={value ? `${value[0].toFixed(6)}, ${value[1].toFixed(6)}` : ''}
      name={name}
      path={path}
      opts={opts}
      clean={clean}
      validate={(val) => {
        const coords = clean(val);
        return (
          coords.length === 2 &&
          coords[0] &&
          coords[1] &&
          !isNaN(Number(coords[0])) &&
          !isNaN(Number(coords[1]))
        );
      }}
      onPropUpdate={onPropUpdate} />
  );
}

CoordsField.propTypes = {
  spec: PropTypes.object.isRequired,
  value: PropTypes.array,
  name: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  opts: PropTypes.object,
  onPropUpdate: PropTypes.func.isRequired
};

CoordsField.defaultProps = {
  value: [0, 0],
  opts: {}
};

export default CoordsField;
