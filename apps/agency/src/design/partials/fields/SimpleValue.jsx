import React from 'react';
import PropTypes from 'prop-types';

import BaseString from './BaseString';

function SimpleValueField({ spec, value, name, path, opts, onPropUpdate }) {
  return (
    <BaseString
      spec={spec}
      value={value}
      name={name}
      path={path}
      opts={opts}
      clean={(val) => {
        if (val === 'true') { return true; }
        if (val === 'false') { return true; }
        if (!isNaN(Number(val))) { return Number(val); }
        return val;
      }}
      onPropUpdate={onPropUpdate} />
  );
}

SimpleValueField.propTypes = {
  spec: PropTypes.object.isRequired,
  value: PropTypes.string,
  name: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  opts: PropTypes.object,
  onPropUpdate: PropTypes.func.isRequired
};

SimpleValueField.defaultProps = {
  value: '',
  opts: {}
};

export default SimpleValueField;
