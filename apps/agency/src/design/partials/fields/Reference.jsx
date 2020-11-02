import _ from 'lodash';
import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

import { SceneCore, TextUtil } from 'fptcore';

import {
  titleForResource,
  titleForResourceType
} from '../../utils/text-utils';
import { urlForResource } from '../../utils/section-utils';
import BaseEmpty from './BaseEmpty';
import BaseEnum from './BaseEnum';
import ResourceBadge from '../../../partials/ResourceBadge';

function labelForValue(script, spec, value) {
  const collection = script.content[spec.collection];
  const referringToResource = _.find(collection, { name: value });

  if (referringToResource) {
    const resourceType = TextUtil.singularize(spec.collection);
    const title = titleForResource(script.content, spec.collection,
      referringToResource);
    return (
      <span style={{ whiteSpace: 'nowrap' }}>
        <ResourceBadge
          className="mr-1"
          resourceType={resourceType}
          showType={false} />
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

function choicesForSpec(script, resource, spec) {
  const collection = script.content[spec.collection];
  const filtered = _.filter(collection, (rel) => {
    // Hacky filtering by scene.
    if (rel.scene && resource.scene && rel.scene !== resource.scene) {
      return false;
    }
    // Hacky filtering by role for pages / appearances.
    if (rel.role && resource.role && rel.role !== resource.role) {
      return false;
    }
    return true;
  });
  const specialChoices = [{ value: '', label: '---' }];
  if (spec.specialValues) {
    specialChoices.push(...spec.specialValues);
  }
  const choices = specialChoices.concat(filtered
    .sort(SceneCore.sortResource)
    .map(rel => ({
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

  if (!value) {
    const collectionName = spec.collection;
    const resourceType = TextUtil.singularize(collectionName);
    const collection = script.content[collectionName];
    if (!collection || !collection.length) {
      return (
        <em className="faint">
          No {titleForResourceType(resourceType).toLowerCase()}s exist.
        </em>
      );
    }
  }

  const collection = script.content[spec.collection];
  const referringToResource = _.find(collection, { name: value });
  const link = referringToResource ? (
    <Link
      className="text-dark ml-1"
      to={urlForResource(script, spec.collection, value)}>
      <i className="faint fa fa-external-link-square-alt" />
    </Link>
  ) : null;
  return (
    <>
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
      {link}
    </>
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
