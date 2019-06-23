import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';

import ObjectKey from './ObjectKey';

function ObjectField({ script, resource, spec, value, name, path, opts,
  onPropUpdate, onArrayUpdate, renderAny }) {
  const props = _(Object.keys(spec.properties))
    .sortBy(key => !!_.get(spec.properties[key], 'display.last'))
    .value();
  const renderedItems = _.map(props, key => (
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
      onArrayUpdate={onArrayUpdate}
      renderAny={renderAny} />
  ));
  const isInline = (
    _.get(spec, 'display.form') === 'inline' ||
    _.get(opts, 'inline')
  );
  const divStyle = isInline ? { display: 'inline-block' } : {};
  return (
    <div style={divStyle} className="object">
      {renderedItems}
    </div>
  );
}

ObjectField.defaultProps = { opts: {}, value: {} };
ObjectField.propTypes = {
  script: PropTypes.object.isRequired,
  resource: PropTypes.object.isRequired,
  onPropUpdate: PropTypes.func.isRequired,
  onArrayUpdate: PropTypes.func.isRequired,
  spec: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  opts: PropTypes.object,
  value: PropTypes.object,
  renderAny: PropTypes.func.isRequired
};

export default ObjectField;
