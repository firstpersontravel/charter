import React from 'react';
import PropTypes from 'prop-types';

import AnyField from './Any';
import ObjectField from './Object';

function ResourceField({ script, resource, spec, value,
  onPropUpdate, onArrayUpdate }) {
  return (
    <ObjectField
      script={script}
      resource={resource}
      spec={spec}
      value={value}
      name={''}
      path={''}
      opts={{}}
      renderAny={AnyField}
      onPropUpdate={onPropUpdate}
      onArrayUpdate={onArrayUpdate} />
  );
}

ResourceField.defaultProps = { opts: {} };
ResourceField.propTypes = {
  script: PropTypes.object.isRequired,
  resource: PropTypes.object.isRequired,
  onPropUpdate: PropTypes.func.isRequired,
  onArrayUpdate: PropTypes.func.isRequired,
  spec: PropTypes.object.isRequired,
  value: PropTypes.object.isRequired
};

export default ResourceField;
