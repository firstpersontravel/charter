import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

import { coreRegistry, coreWalker, TextUtil, SceneCore } from 'fptcore';

import { urlForResource } from '../../utils/section-utils';
import { titleForResource } from '../../utils/text-utils';
import BaseEmpty from './BaseEmpty';
import BaseEnum from './BaseEnum';

function titleForComponent(scriptContent, componentType, referringTo) {
  const componentClass = coreRegistry.components[componentType];
  const componentTypeSingular = TextUtil.singularize(componentType);
  const variant = referringTo[2][componentClass.typeKey];
  const variantClass = coreRegistry[componentType][variant];

  const resourceTitle = titleForResource(scriptContent, referringTo[0],
    referringTo[1]);

  let componentTitle = `${variant} ${componentTypeSingular}`;
  if (variantClass && variantClass.getTitle) {
    componentTitle = variantClass.getTitle(referringTo[1], referringTo[2],
      scriptContent);
  }
  return `${resourceTitle} - ${componentTitle}`;
}

function labelForValue(script, spec, referringTo) {
  if (referringTo[0]) {
    const title = titleForComponent(script.content, spec.componentType,
      referringTo);
    return (
      <span style={{ whiteSpace: 'nowrap' }}>
        {title}
      </span>
    );
  }
  return (
    <BaseEmpty spec={spec} />
  );
}

function choicesForSpec(script, spec) {
  const componentClass = coreRegistry.components[spec.componentType];
  const typeKey = componentClass.typeKey;
  const resAndComponents = coreWalker
    .getResourcesAndComponentsByComponentType(script.content,
      spec.componentType)
    .filter(([col, res, obj]) => obj[typeKey] === spec.componentVariant);

  const choices = [{ value: '', label: '---' }]
    .sort((a, b) => SceneCore.sortResource(a[1], b[1]))
    .concat(resAndComponents.map(referringTo => ({
      value: referringTo[2].id,
      label: titleForComponent(script.content, spec.componentType,
        referringTo)
    })));
  return choices;
}

function ComponentReferenceField({ script, resource, spec, value, name, path,
  opts, onPropUpdate }) {
  const componentType = spec.componentType;
  const referringTo = coreWalker.getResourceAndComponentById(script.content,
    componentType, value);

  const label = labelForValue(script, spec, referringTo);
  if (opts && opts.editable === false) {
    return label;
  }

  const link = referringTo[0] ? (
    <Link
      className="text-dark ml-1"
      to={urlForResource(script, referringTo[0], referringTo[1].name)}>
      <i className="faint fa fa-external-link-square" />
    </Link>
  ) : null;

  return (
    <>
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
      {link}
    </>
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
