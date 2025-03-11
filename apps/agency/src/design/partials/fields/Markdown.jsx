import React from 'react';
import PropTypes from 'prop-types';

import BaseString from './BaseString';

function MarkdownField({
  spec, value, name, path, opts, onPropUpdate
}) {
  return (
    <BaseString
      spec={spec}
      value={value}
      name={name}
      path={path}
      opts={opts}
      onPropUpdate={onPropUpdate} />
  );
}

MarkdownField.propTypes = {
  spec: PropTypes.object.isRequired,
  value: PropTypes.string,
  name: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  opts: PropTypes.object,
  onPropUpdate: PropTypes.func.isRequired
};

MarkdownField.defaultProps = {
  value: '',
  opts: {}
};

export default MarkdownField;
