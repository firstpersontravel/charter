import React from 'react';
import PropTypes from 'prop-types';

import BaseString from './BaseString';

function StringField({
  spec, value, name, path, opts, onPropUpdate
}) {
  return (
    <BaseString
      spec={spec}
      value={value || ''}
      name={name}
      path={path}
      opts={opts}
      onPropUpdate={onPropUpdate} />
  );
}

StringField.propTypes = {
  spec: PropTypes.object.isRequired,
  value: PropTypes.string,
  name: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  opts: PropTypes.object,
  onPropUpdate: PropTypes.func.isRequired
};

StringField.defaultProps = {
  value: '',
  opts: {}
};

export default StringField;
