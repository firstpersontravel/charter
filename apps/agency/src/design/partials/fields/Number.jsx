import React from 'react';
import PropTypes from 'prop-types';

import BaseString from './BaseString';

function NumberField({
  spec, value, name, path, opts, onPropUpdate
}) {
  return (
    <BaseString
      spec={spec}
      value={value ? value.toString() : ''}
      name={name}
      path={path}
      opts={opts}
      validate={val => !Number.isNaN(Number(val))}
      clean={val => Number(val)}
      onPropUpdate={onPropUpdate} />
  );
}

NumberField.propTypes = {
  spec: PropTypes.object.isRequired,
  value: PropTypes.number,
  name: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  opts: PropTypes.object,
  onPropUpdate: PropTypes.func.isRequired
};

NumberField.defaultProps = {
  value: null,
  opts: {}
};

export default NumberField;
