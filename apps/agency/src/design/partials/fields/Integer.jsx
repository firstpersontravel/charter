import React from 'react';
import PropTypes from 'prop-types';

import BaseString from './BaseString';

function IntegerField({
  spec, value, name, path, opts, onPropUpdate
}) {
  return (
    <BaseString
      spec={spec}
      value={value ? value.toString() : ''}
      name={name}
      path={path}
      opts={opts}
      validate={val => Number.isInteger(Number(val))}
      clean={val => Number(val)}
      onPropUpdate={onPropUpdate} />
  );
}

IntegerField.propTypes = {
  spec: PropTypes.object.isRequired,
  value: PropTypes.number,
  name: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  opts: PropTypes.object,
  onPropUpdate: PropTypes.func.isRequired
};

IntegerField.defaultProps = {
  value: null,
  opts: {}
};

export default IntegerField;
