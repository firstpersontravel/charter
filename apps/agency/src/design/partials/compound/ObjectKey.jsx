import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';

import { Registry, Validator } from 'fptcore';

import BaseClear from '../fields/BaseClear';
import Label from './Label';

const validator = new Validator(Registry);

const COMPLEX_TYPES = ['dictionary', 'object', 'list', 'component'];

function invalidWarningForSpec(script, keySpec, value, itemValue) {
  // Don't show invalid warning on complex types -- wait for iterating
  // into nested children.
  if (_.includes(COMPLEX_TYPES, keySpec.type)) {
    return null;
  }

  // If item is null, error if required AND if the parent object isn't null.
  // If the parent object is null, then there it should be invalid or not
  // based on the parent validator.
  if (_.isNull(itemValue) || _.isUndefined(itemValue)) {
    if (keySpec.required && !!value) {
      return (
        <i
          title={`${keySpec.type} required`}
          className="fa fa-exclamation-circle text-danger ml-1" />
      );
    }
    return null;
  }

  // If item is not null, call the validator functions.
  const validatorErrors = validator.validateParam(script.content,
    name, keySpec, itemValue);
  if (validatorErrors && validatorErrors.length > 0) {
    return (
      <i
        title={validatorErrors.join(', ')}
        className="fa fa-exclamation-circle text-danger ml-1" />
    );
  }

  // No errors!
  return null;
}

function shouldShowClear(keySpec, itemPath) {
  if (keySpec.type === 'boolean') {
    return false;
  }
  if (keySpec.type === 'component') {
    return true;
  }
  return !_.includes(COMPLEX_TYPES, keySpec.type);
}

function clearForSpec(keySpec, itemValue, itemPath, onPropUpdate) {
  if (!shouldShowClear(keySpec, itemPath)) {
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

function shouldHideSpec(script, value, spec, keySpec, keyName) {
  // Hide hidden fields
  if (_.get(keySpec, 'display.hidden')) {
    return true;
  }
  // Hide optional references if no objects exist in that reference.
  if (keySpec.type === 'reference' && !keySpec.required && !value[keyName]) {
    const collectionName = keySpec.collection;
    const collection = script.content[collectionName];
    if (!collection || !collection.length) {
      return true;
    }
  }
  return false;
}

function ObjectKey({ script, resource, spec, value, name, path, opts, keySpec,
  keyName, onPropUpdate, renderAny }) {
  if (shouldHideSpec(script, value, spec, keySpec)) {
    return null;
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
        onPropUpdate: onPropUpdate
      })}
      {clearForSpec(keySpec, itemValue, itemPath, onPropUpdate)}
      {invalidWarningForSpec(script, keySpec, value, itemValue)}
    </div>
  );
}

ObjectKey.defaultProps = { opts: {}, value: null };
ObjectKey.propTypes = {
  script: PropTypes.object.isRequired,
  resource: PropTypes.object.isRequired,
  onPropUpdate: PropTypes.func.isRequired,
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
