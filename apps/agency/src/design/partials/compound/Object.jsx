import React from 'react';
import PropTypes from 'prop-types';

import ObjectKey from './ObjectKey';

function ObjectField({
  script, resource, spec, value, name, path, opts,
  onPropUpdate, renderAny
}) {
  return Object.keys(spec.properties).map(key => (
    <ObjectKey
      key={key}
      script={script}
      resource={resource}
      spec={spec}
      value={value}
      name={name}
      path={path}
      opts={opts}
      keySpec={spec.properties[key]}
      keyName={key}
      onPropUpdate={onPropUpdate}
      renderAny={renderAny} />
  ));
}

ObjectField.defaultProps = { opts: {}, value: null };
ObjectField.propTypes = {
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

export default ObjectField;
