import React from 'react';
import PropTypes from 'prop-types';

import AnyField from './Any';
import ObjectField from './Object';

function ResourceField({ script, resource, excludeFields, spec, value,
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

  const displayProperties = Object.fromEntries(Object.keys(spec.properties)
    .filter((key) => {
      // If we're missing keys, only show required ones.
      if (numMissingRequiredKeys > 0) {
        if (!spec.properties[key].required) {
          return false;
        }
      }
      // Otherwise include as long as we're not excluded.
      return excludeFields.indexOf(key) === -1;
    })
    .map(key => [key, spec.properties[key]]));

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

ResourceField.propTypes = {
  script: PropTypes.object.isRequired,
  resource: PropTypes.object.isRequired,
  excludeFields: PropTypes.array,
  onPropUpdate: PropTypes.func.isRequired,
  spec: PropTypes.object.isRequired,
  value: PropTypes.object.isRequired
};

ResourceField.defaultProps = {
  opts: {},
  excludeFields: []
};

export default ResourceField;
