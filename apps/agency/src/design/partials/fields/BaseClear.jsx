import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';

function BaseClear({ spec, value, path, onPropUpdate }) {
  const shouldAllowClear = (
    !spec.required &&
    !spec.parent &&
    !_.isUndefined(value) &&
    !_.isNull(value)
  );
  if (!shouldAllowClear) {
    return null;
  }
  return (
    <button
      className="btn-unstyled clear-btn faint ml-1"
      onClick={() => onPropUpdate(path, null)}>
      <i className="fa fa-close" />
    </button>
  );
}

BaseClear.propTypes = {
  spec: PropTypes.object.isRequired,
  value: PropTypes.any,
  path: PropTypes.string.isRequired,
  onPropUpdate: PropTypes.func.isRequired
};

BaseClear.defaultProps = {
  value: null
};

export default BaseClear;
