import React from 'react';
import PropTypes from 'prop-types';

import { coreRegistry, coreWalker, TextUtil } from 'fptcore';

import BaseEmpty from './BaseEmpty';
import BaseEnum from './BaseEnum';

function titleForComponent(scriptContent, componentType, obj) {
  const componentClass = coreRegistry.components[componentType];
  const componentTypeSingular = TextUtil.singularize(componentType);
  const variant = obj[componentClass.typeKey];
  const variantClass = coreRegistry[componentType][variant];
  if (variantClass && variantClass.getTitle) {
    return variantClass.getTitle(obj, scriptContent);
  }
  return `${variant} ${componentTypeSingular} #${obj.id}`;
}

function labelForValue(script, spec, value) {
  const componentType = spec.componentType;
  const referringToComponent = coreWalker.getComponentById(script.content,
    componentType, value);
  if (referringToComponent) {
    const title = titleForComponent(script.content, componentType,
      referringToComponent);
    return (
      <span style={{ whiteSpace: 'nowrap' }}>
        {title}
      </span>
    );
  }
  if (spec.specialValues) {
    // eslint-disable-next-line no-restricted-syntax
    for (const specialValue of spec.specialValues) {
      if (value === specialValue.value) {
        return specialValue.label;
      }
    }
  }
  return (
    <BaseEmpty spec={spec} />
  );
}

function choicesForSpec(script, spec) {
  const componentClass = coreRegistry.components[spec.componentType];
  const typeKey = componentClass.typeKey;
  const components = coreWalker
    .getComponentsByType(script.content, spec.componentType)
    .filter(obj => obj[typeKey] === spec.componentVariant);

  const specialChoices = [{ value: '', label: '---' }];
  if (spec.specialValues) {
    specialChoices.push(...spec.specialValues);
  }
  const choices = specialChoices.concat(components.map(rel => ({
    value: rel.id,
    label: titleForComponent(script.content, spec.componentType, rel)
  })));
  return choices;
}

function ComponentReferenceField({ script, resource, spec, value, name, path,
  opts, onPropUpdate }) {
  const label = labelForValue(script, spec, value);
  if (opts && opts.editable === false) {
    return label;
  }
  return (
    <BaseEnum
      spec={spec}
      value={value ? value.toString() : ''}
      name={name}
      path={path}
      opts={opts}
      clean={val => (val === '' ? null : Number(val))}
      choices={choicesForSpec(script, spec)}
      label={label}
      onPropUpdate={onPropUpdate} />
  );
}

ComponentReferenceField.propTypes = {
  script: PropTypes.object.isRequired,
  resource: PropTypes.object.isRequired,
  spec: PropTypes.object.isRequired,
  value: PropTypes.number,
  name: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  opts: PropTypes.object,
  onPropUpdate: PropTypes.func.isRequired
};

ComponentReferenceField.defaultProps = {
  value: null,
  opts: {}
};

export default ComponentReferenceField;
