import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';

import { TextUtil } from 'fptcore';

import BaseEmpty from './BaseEmpty';
import PopoverControl from '../../../partials/PopoverControl';

function BaseEnum({ spec, value, name, path, opts, choices, clean, label, onPropUpdate }) {
  if (opts.editable === false) {
    return value;
  }
  // Special hack for 'type' params.
  const onEnumUpdate = (val) => {
    // Special overrides just for dictionary keys
    if (opts.onConfirm) {
      opts.onConfirm(val);
      return;
    }
    // Special handling of event type,
    if (_.startsWith(path, 'event') && _.endsWith(path, '.type')) {
      // Clear out other values.
      onPropUpdate(path.replace(/\.type$/, ''), { type: clean(val) });
      return;
    }
    // And special handling of action name.
    if (_.startsWith(path, 'actions') && _.endsWith(path, '.name')) {
      // Clear out other values.
      onPropUpdate(path.replace(/\.name$/, ''), { name: clean(val) });
      return;
    }
    onPropUpdate(path, clean(val));
  };
  return (
    <PopoverControl
      title={TextUtil.titleForSpec(spec, name)}
      choices={choices}
      helpText={spec.help}
      onConfirm={onEnumUpdate}
      label={label || value || <BaseEmpty spec={spec} />}
      value={value} />
  );
}

BaseEnum.propTypes = {
  spec: PropTypes.object.isRequired,
  value: PropTypes.string,
  name: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  opts: PropTypes.object,
  choices: PropTypes.array.isRequired,
  clean: PropTypes.func,
  label: PropTypes.node,
  onPropUpdate: PropTypes.func.isRequired
};

BaseEnum.defaultProps = {
  value: '',
  opts: {},
  label: null,
  clean: val => val
};

export default BaseEnum;
