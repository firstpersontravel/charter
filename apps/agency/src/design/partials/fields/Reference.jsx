import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';

import { TextUtil } from 'fptcore';

import { titleForResource } from '../../utils/text-utils';
import BaseEmpty from './BaseEmpty';
import BaseEnum from './BaseEnum';
import ResourceBadge from '../ResourceBadge';

function labelForValue(script, spec, value) {
  const collection = script.content[spec.collection];
  const referringToResource = _.find(collection, { name: value });

  if (referringToResource) {
    const resourceType = TextUtil.singularize(spec.collection);
    const title = titleForResource(script.content, spec.collection,
      referringToResource);
    return (
      <span style={{ whiteSpace: 'nowrap' }}>
        <ResourceBadge resourceType={resourceType} showType={false} />
        &nbsp;{title}
      </span>
    );
  }
  if (value === 'null') {
    return 'None';
  }
  return (
    <BaseEmpty spec={spec} />
  );
}

function choicesForSpec(script, resource, spec) {
  const collection = script.content[spec.collection];
  const filtered = _.filter(collection, (rel) => {
    // Hacky filtering by scene.
    if (rel.scene && resource.scene &&
      rel.scene !== resource.scene) {
      return false;
    }
    // Hacky filtering by role for pages / appearances.
    if (rel.role && resource.role &&
      rel.role !== resource.role) {
      return false;
    }
    return true;
  });
  const nullChoices = [{ value: '', label: '---' }];
  if (spec.allowNull) {
    nullChoices.push({ value: 'null', label: 'None' });
  }
  const choices = nullChoices.concat(filtered.map(rel => ({
    value: rel.name,
    label: titleForResource(script.content, spec.collection, rel)
  })));
  return choices;
}

function ReferenceField({ script, resource, spec, value, name, path, opts, onPropUpdate }) {
  const label = labelForValue(script, spec, value);
  if (opts && opts.editable === false) {
    return label;
  }
  return (
    <BaseEnum
      spec={spec}
      value={value}
      name={name}
      path={path}
      opts={opts}
      clean={val => (val === '' ? null : val)}
      choices={choicesForSpec(script, resource, spec)}
      label={label}
      onPropUpdate={onPropUpdate} />
  );
}

ReferenceField.propTypes = {
  script: PropTypes.object.isRequired,
  resource: PropTypes.object.isRequired,
  spec: PropTypes.object.isRequired,
  value: PropTypes.string,
  name: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  opts: PropTypes.object,
  onPropUpdate: PropTypes.func.isRequired
};

ReferenceField.defaultProps = {
  value: '',
  opts: {}
};

export default ReferenceField;
