import React from 'react';
import PropTypes from 'prop-types';

import { Validations } from 'fptcore';

import BaseEmpty from './BaseEmpty';
import PopoverControl from '../../../partials/PopoverControl';
import { typeTitleForSpec, labelForSpec } from '../../utils/spec-utils';

export function bottomHelpForSpec(spec) {
  const validation = Validations[spec.type];
  if (!validation || !validation.help) {
    return null;
  }
  return `This is a ${typeTitleForSpec(spec)} field: ${validation.help}`;
}

function BaseString({
  spec, value, name, path, opts, validate, clean, onPropUpdate
}) {
  const isMultiline = spec.display && spec.display.multiline;
  const isTextarea = spec.type === 'markdown' || isMultiline;
  const textLabel = isTextarea ? (
    <div style={{ whiteSpace: 'pre-wrap' }}>{value}</div>
  ) : value;
  const label = value ? textLabel : <BaseEmpty spec={spec} />;
  if (opts.editable === false) {
    return value;
  }
  // Special overrides just for dictionary keys
  const onConfirm = opts.onConfirm || (val => onPropUpdate(path, clean(val)));
  const validateWithBlank = (val) => {
    if (spec.required && val === '') {
      return false;
    }
    return validate(val);
  };
  return (
    <PopoverControl
      title={`${typeTitleForSpec(spec)}: ${labelForSpec(spec, name)}`}
      validate={validateWithBlank}
      helpText={spec.help}
      helpTextBottom={bottomHelpForSpec(spec)}
      onConfirm={onConfirm}
      label={label}
      isTextarea={isTextarea}
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
