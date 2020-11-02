import React from 'react';
import PropTypes from 'prop-types';

import BooleanField from '../fields/Boolean';
import ColorField from '../fields/Color';
import ComponentField from './Component';
import ComponentReferenceField from '../fields/ComponentReference';
import CoordsField from '../fields/Coords';
import DictionaryField from './Dictionary';
import EmailField from '../fields/Email';
import EnumField from '../fields/Enum';
import IntegerField from '../fields/Integer';
import ListField from './List';
import LocationField from '../fields/Location';
import LookupableField from '../fields/Lookupable';
import MarkdownField from '../fields/Markdown';
import MediaField from '../fields/Media';
import NameField from '../fields/Name';
import NumberField from '../fields/Number';
import ObjectField from './Object';
import ReferenceField from '../fields/Reference';
import SimpleAttributeField from '../fields/SimpleAttribute';
import SimpleValueField from '../fields/SimpleValue';
import StringField from '../fields/String';
import TimeOffsetField from '../fields/TimeOffset';
import TimeShorthandField from '../fields/TimeShorthand';

const fieldComponents = {
  boolean: BooleanField,
  color: ColorField,
  component: ComponentField,
  componentReference: ComponentReferenceField,
  coords: CoordsField,
  dictionary: DictionaryField,
  email: EmailField,
  enum: EnumField,
  integer: IntegerField,
  list: ListField,
  location: LocationField,
  lookupable: LookupableField,
  markdown: MarkdownField,
  media: MediaField,
  name: NameField,
  number: NumberField,
  object: ObjectField,
  reference: ReferenceField,
  simpleAttribute: SimpleAttributeField,
  simpleValue: SimpleValueField,
  string: StringField,
  timeOffset: TimeOffsetField,
  timeShorthand: TimeShorthandField
};

function AnyField({ script, resource, spec, value, name, path, opts,
  onPropUpdate }) {
  const fieldType = spec.type;
  if (!fieldComponents[fieldType]) {
    return `??? (${fieldType})`;
  }
  const Component = fieldComponents[fieldType];
  return (
    <Component
      script={script}
      resource={resource}
      spec={spec}
      value={value}
      name={name}
      path={path}
      opts={opts}
      onPropUpdate={onPropUpdate}
      renderAny={AnyField} />
  );
}

AnyField.defaultProps = { opts: {}, value: null };
AnyField.propTypes = {
  script: PropTypes.object.isRequired,
  resource: PropTypes.object.isRequired,
  onPropUpdate: PropTypes.func.isRequired,
  spec: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  opts: PropTypes.object,
  value: PropTypes.any
};

export default AnyField;
