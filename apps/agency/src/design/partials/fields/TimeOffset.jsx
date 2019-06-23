import React from 'react';
import PropTypes from 'prop-types';

import { Validations } from 'fptcore';

import BaseString from './BaseString';

function isEmpty(warnings) {
  return !warnings || warnings.length === 0;
}

function TimeOffsetField({ script, spec, value, name, path, opts, onPropUpdate }) {
  return (
    <BaseString
      spec={spec}
      value={value}
      name={name}
      path={path}
      opts={opts}
      validate={val => (
        isEmpty(Validations.timeOffset(script, name, spec, val))
      )}
      onPropUpdate={onPropUpdate} />
  );
}

TimeOffsetField.propTypes = {
  script: PropTypes.object.isRequired,
  spec: PropTypes.object.isRequired,
  value: PropTypes.string,
  name: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  opts: PropTypes.object,
  onPropUpdate: PropTypes.func.isRequired
};

TimeOffsetField.defaultProps = {
  value: '',
  opts: {}
};

export default TimeOffsetField;
