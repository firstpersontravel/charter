import React from 'react';
import PropTypes from 'prop-types';

const FptCore = require('fptcore').default;

import ObjectKey from './ObjectKey';
import NewComponentBtn from './NewComponentBtn';

function ComponentField({
  script, resource, spec, value, name, path, opts,
  onPropUpdate, renderAny
}) {
  if (!value) {
    const newComponentLabel = (
      <span className="btn btn-sm btn-outline-secondary">
        <i className="fa fa-plus" />
      </span>
    );
    return (
      <NewComponentBtn
        label={newComponentLabel}
        componentSpec={spec}
        onConfirm={(newComponent) => {
          onPropUpdate(path, newComponent);
        }} />
    );
  }

  const componentType = spec.component;
  const componentClass = FptCore.coreRegistry.components[componentType];
  const componentTypeKey = componentClass.typeKey;

  const variety = FptCore.coreRegistry.getComponentVariety(spec, value);
  const varietyClass = FptCore.coreRegistry.getComponentClass(spec, variety);

  const objectFields = Object
    .keys(varietyClass.properties)
    .filter(key => key !== componentTypeKey)
    .map(key => (
      <ObjectKey
        key={key}
        script={script}
        resource={resource}
        spec={varietyClass}
        value={value}
        name={name}
        path={path}
        opts={opts}
        keySpec={varietyClass.properties[key]}
        keyName={key}
        onPropUpdate={onPropUpdate}
        renderAny={renderAny} />
    ));

  const varietyTitle = varietyClass.title || FptCore.TextUtil.titleForKey(variety);
  const titleStyle = {
    fontWeight: 'bold',
    display: 'inline-block',
    marginRight: '0.5em'
  };
  return (
    <>
      <div style={titleStyle}>{varietyTitle}</div>
      {objectFields}
    </>
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
