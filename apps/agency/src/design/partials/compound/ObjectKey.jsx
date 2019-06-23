import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';

import { Registry, Validator } from 'fptcore';

import BaseClear from '../fields/BaseClear';
import Label from './Label';

const validator = new Validator(Registry);

const COMPLEX_TYPES = ['dictionary', 'object', 'list', 'component'];

function invalidWarningForSpec(script, keySpec, itemValue) {
  const isSimpleType = !_.includes(COMPLEX_TYPES, keySpec.type);
  if (isSimpleType) {
    if (_.isNull(itemValue) || _.isUndefined(itemValue)) {
      if (keySpec.required) {
        return (
          <i className="fa fa-exclamation-circle text-danger ml-1" />
        );
      }
    } else {
      const validatorErrors = validator.validateParam(script,
        name, keySpec, itemValue);
      if (validatorErrors && validatorErrors.length > 0) {
        return (
          <i className="fa fa-exclamation-circle text-danger ml-1" />
        );
      }
    }
  }
  return null;
}

function clearForSpec(keySpec, itemValue, itemPath, onPropUpdate) {
  const isSimpleType = !_.includes(COMPLEX_TYPES, keySpec.type);
  const shouldShowClear = isSimpleType && keySpec.type !== 'boolean';
  if (!shouldShowClear) {
    return null;
  }
  return (
    <BaseClear
      spec={keySpec}
      value={itemValue}
      path={itemPath}
      onPropUpdate={onPropUpdate} />
  );
}

function ObjectKey({ script, resource, spec, value, name, path, opts, keySpec,
  keyName, onPropUpdate, onArrayUpdate, renderAny }) {
  // Hide hidden fields
  if (_.get(keySpec, 'display.hidden')) {
    return null;
  }
  // Hide optional references if no objects exist in that reference.
  if (keySpec.type === 'reference' && !keySpec.required && !value[keyName]) {
    const collectionName = keySpec.collection;
    const collection = script.content[collectionName];
    if (!collection || !collection.length) {
      return null;
    }
  }

  const isInline = (
    _.get(spec, 'display.form') === 'inline' ||
    _.get(opts, 'inline')
  );
  // Nest inline
  const optsWithInline = isInline ?
    Object.assign({}, opts, { inline: true }) :
    opts;
  const inlineStyle = { display: 'inline-block', marginRight: '0.5em' };
  const itemStyle = isInline ? inlineStyle : {};
  const itemPath = `${path}${path ? '.' : ''}${keyName}`;
  const itemValue = _.get(value, keyName);
  return (
    <div style={itemStyle}>
      <Label spec={keySpec} name={keyName} />
      {renderAny({
        script: script,
        resource: resource,
        spec: keySpec,
        value: itemValue,
        name: _.startCase(keyName),
        path: itemPath,
        opts: optsWithInline,
        onPropUpdate: onPropUpdate,
        onArrayUpdate: onArrayUpdate
      })}
      {clearForSpec(keySpec, itemValue, itemPath, onPropUpdate)}
      {invalidWarningForSpec(script, keySpec, itemValue)}
    </div>
  );
}

ObjectKey.defaultProps = { opts: {}, value: null };
ObjectKey.propTypes = {
  script: PropTypes.object.isRequired,
  resource: PropTypes.object.isRequired,
  onPropUpdate: PropTypes.func.isRequired,
  onArrayUpdate: PropTypes.func.isRequired,
  spec: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  opts: PropTypes.object,
  value: PropTypes.object,
  keySpec: PropTypes.object.isRequired,
  keyName: PropTypes.string.isRequired,
  renderAny: PropTypes.func.isRequired
};

export default ObjectKey;
