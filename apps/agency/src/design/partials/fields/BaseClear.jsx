import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';

function BaseClear({
  spec, value, path, onPropUpdate
}) {
  const shouldAllowClear = (
    !spec.required
    && !spec.parent
    && !_.isUndefined(value)
    && !_.isNull(value)
  );
  if (!shouldAllowClear) {
    return null;
  }
  return (
    <button
      style={{ verticalAlign: 'top' }}
      className="btn-unstyled clear-btn faint m-1"
      onClick={() => onPropUpdate(path, '___DELETE')}>
      <i className="fa fa-times" />
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
