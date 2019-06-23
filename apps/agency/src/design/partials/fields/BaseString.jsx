import React from 'react';
import PropTypes from 'prop-types';

import BaseEmpty from './BaseEmpty';
import PopoverControl from '../../../partials/PopoverControl';

function BaseString({ spec, value, name, path, opts, validate, clean, onPropUpdate }) {
  const allowNewlines = spec.type === 'markdown';
  const textLabel = allowNewlines ? (
    <div style={{ whiteSpace: 'pre-wrap' }}>{value}</div>
  ) : value;
  const label = value ? textLabel : <BaseEmpty spec={spec} />;
  if (opts.editable === false) {
    return value;
  }
  // Special overrides just for dictionary keys
  const onConfirm = opts.onConfirm || (val => onPropUpdate(path, clean(val)));
  return (
    <PopoverControl
      title={name}
      validate={validate}
      helpText={spec.help}
      onConfirm={onConfirm}
      label={label}
      value={value} />
  );
}

BaseString.propTypes = {
  spec: PropTypes.object.isRequired,
  value: PropTypes.string,
  name: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  opts: PropTypes.object,
  validate: PropTypes.func,
  clean: PropTypes.func,
  onPropUpdate: PropTypes.func.isRequired
};

BaseString.defaultProps = {
  value: '',
  opts: {},
  validate: () => true,
  clean: val => val
};

export default BaseString;
