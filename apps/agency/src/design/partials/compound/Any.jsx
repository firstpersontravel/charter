import React from 'react';
import PropTypes from 'prop-types';

import BooleanField from '../fields/Boolean';
import ComponentField from './Component';
import CoordsField from '../fields/Coords';
import DictionaryField from './Dictionary';
import EnumField from '../fields/Enum';
import EmailField from '../fields/Email';
import ListField from './List';
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
  component: ComponentField,
  coords: CoordsField,
  dictionary: DictionaryField,
  email: EmailField,
  enum: EnumField,
  list: ListField,
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
