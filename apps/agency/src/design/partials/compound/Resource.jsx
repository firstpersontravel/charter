import React from 'react';
import PropTypes from 'prop-types';

import AnyField from './Any';
import ObjectField from './Object';

function ResourceField({ script, resource, spec, value,
  onPropUpdate }) {
  // If value is missing any required fields, then just show the required
  // fields before allowing you to fill in any others. In practice the only
  // resources that are missing required fields should be new ones.
  const requiredKeys = Object
    .keys(spec.properties)
    .filter(key => spec.properties[key].required);

  const numMissingRequiredKeys = requiredKeys
    .filter(key => !value[key])
    .length;

  const displayProperties = numMissingRequiredKeys > 0
    ? Object.fromEntries(requiredKeys.map(key => [key, spec.properties[key]]))
    : spec.properties;

  return (
    <ObjectField
      script={script}
      resource={resource}
      spec={{ properties: displayProperties }}
      value={value}
      name={''}
      path={''}
      opts={{}}
      renderAny={AnyField}
      onPropUpdate={onPropUpdate} />
  );
}

ResourceField.defaultProps = { opts: {} };
ResourceField.propTypes = {
  script: PropTypes.object.isRequired,
  resource: PropTypes.object.isRequired,
  onPropUpdate: PropTypes.func.isRequired,
  spec: PropTypes.object.isRequired,
  value: PropTypes.object.isRequired
};

export default ResourceField;
