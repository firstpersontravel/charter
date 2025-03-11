import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';

import {
  defaultForSpec,
  doesSpecHaveDefault
} from '../../utils/resource-utils';

function BooleanField({
  spec, value, name, path, opts, onPropUpdate
}) {
  const style = _.isUndefined(value) ? { opacity: 0.5 } : {};
  const def = doesSpecHaveDefault(spec) ? defaultForSpec(spec) : false;
  const existing = _.isUndefined(value) ? def : value;
  return (
    <input
      className="ml-1 mt-2"
      style={style}
      type="checkbox"
      checked={!!existing}
      onChange={e => onPropUpdate(path, e.target.checked)} />
  );
}

BooleanField.propTypes = {
  spec: PropTypes.object.isRequired,
  value: PropTypes.bool,
  name: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  opts: PropTypes.object,
  onPropUpdate: PropTypes.func.isRequired
};

BooleanField.defaultProps = {
  value: null,
  opts: {}
};

export default BooleanField;
