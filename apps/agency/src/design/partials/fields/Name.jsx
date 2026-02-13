import React from 'react';
import PropTypes from 'prop-types';

const FptCore = require('fptcore').default;

import BaseString from './BaseString';

function isEmpty(warnings) {
  return !warnings || warnings.length === 0;
}

function NameField({
  script, spec, value, name, path, opts, onPropUpdate
}) {
  return (
    <BaseString
      spec={spec}
      value={value}
      name={name}
      path={path}
      opts={opts}
      validate={val => (
        isEmpty(FptCore.Validations.name.validate(script, name, spec, val))
      )}
      onPropUpdate={onPropUpdate} />
  );
}

NameField.propTypes = {
  script: PropTypes.object.isRequired,
  spec: PropTypes.object.isRequired,
  value: PropTypes.string,
  name: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  opts: PropTypes.object,
  onPropUpdate: PropTypes.func.isRequired
};

NameField.defaultProps = {
  value: '',
  opts: {}
};

export default NameField;
