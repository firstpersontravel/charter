import React from 'react';
import PropTypes from 'prop-types';

const FptCore = require('fptcore').default;

import BaseString from './BaseString';

function isEmpty(warnings) {
  return !warnings || warnings.length === 0;
}

function SimpleAttributeField({
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
        isEmpty(FptCore.Validations.simpleAttribute.validate(script, name, spec, val))
      )}
      onPropUpdate={onPropUpdate} />
  );
}

SimpleAttributeField.propTypes = {
  script: PropTypes.object.isRequired,
  spec: PropTypes.object.isRequired,
  value: PropTypes.string,
  name: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  opts: PropTypes.object,
  onPropUpdate: PropTypes.func.isRequired
};

SimpleAttributeField.defaultProps = {
  value: '',
  opts: {}
};

export default SimpleAttributeField;
