import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';

import { coreRegistry, TextUtil } from 'fptcore';

import ObjectKey from './ObjectKey';
import NewComponentBtn from './NewComponentBtn';

function ComponentField({ script, resource, spec, value, name, path, opts,
  onPropUpdate, renderAny }) {
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
  const componentClass = coreRegistry.components[componentType];
  const componentTypeKey = componentClass.typeKey;

  const variety = coreRegistry.getComponentVariety(spec, value);
  const varietyClass = coreRegistry.getComponentClass(spec, variety);

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

  // Nest inline
  const isInline = (
    _.get(varietyClass, 'display.form') === 'inline' ||
    _.get(opts, 'inline')
  );
  const titleBaseStyle = { fontWeight: 'bold' };
  const inlineStyle = { display: 'inline-block', marginRight: '0.5em' };
  const titleStyle = Object.assign(titleBaseStyle,
    isInline ? inlineStyle : {});

  return (
    <>
      <div style={titleStyle}>{TextUtil.titleForKey(variety)}</div>
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
