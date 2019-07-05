import React from 'react';
import PropTypes from 'prop-types';

import { Registry, Validator } from 'fptcore';

import ObjectField from './Object';

const validator = new Validator(Registry);

function ComponentField({ script, resource, spec, value, name, path, opts,
  onPropUpdate, renderAny }) {
  const variety = validator.getComponentVariety(spec, value);
  const varietyClass = validator.getComponentClass(spec, variety);
  return (
    <ObjectField
      script={script}
      resource={resource}
      spec={varietyClass}
      value={value}
      name={name}
      path={path}
      opts={opts}
      onPropUpdate={onPropUpdate}
      renderAny={renderAny} />
  );
}

ComponentField.defaultProps = { opts: {}, value: null };
ComponentField.propTypes = {
  script: PropTypes.object.isRequired,
  resource: PropTypes.object.isRequired,
  onPropUpdate: PropTypes.func.isRequired,
  spec: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  opts: PropTypes.object,
  value: PropTypes.object,
  renderAny: PropTypes.func.isRequired
};

export default ComponentField;
