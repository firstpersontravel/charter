import _ from 'lodash';
import React from 'react';

import { Registry, Validator } from 'fptcore';

import { labelForSpec } from '../utils/spec-utils';
import LabelWithTip from './LabelWithTip';
import { defaultForSpec, doesSpecHaveDefault } from '../utils/resource-utils';
import BaseClear from './fields/BaseClear';
import BooleanField from './fields/Boolean';
import CoordsField from './fields/Coords';
import EnumField from './fields/Enum';
import EmailField from './fields/Email';
import LookupableField from './fields/Lookupable';
import MarkdownField from './fields/Markdown';
import MediaField from './fields/Media';
import NameField from './fields/Name';
import NumberField from './fields/Number';
import ReferenceField from './fields/Reference';
import SimpleAttributeField from './fields/SimpleAttribute';
import SimpleValueField from './fields/SimpleValue';
import StringField from './fields/String';
import TimeOffsetField from './fields/TimeOffset';
import TimeShorthandField from './fields/TimeShorthand';

const COMPLEX_TYPES = ['dictionary', 'object', 'list', 'component'];

const validator = new Validator(Registry);

const newItemsForSpecType = {
  string: '',
  email: '',
  simpleValue: '',
  number: 0,
  boolean: null,
  enum: '',
  timeOffset: '',
  name: '',
  media: '',
  coords: '',
  timeShorthand: '',
  simpleAttribute: '',
  lookupable: '',
  reference: '',
  markdown: '',
  dictionary: {},
  list: [],
  object: {},
  component: {}
};

function newItemForSpec(spec) {
  if (spec.type === 'object') {
    return _(spec.properties)
      .keys()
      .filter(key => doesSpecHaveDefault(spec.properties[key]))
      .map(key => [key, defaultForSpec(spec.properties[key])])
      .fromPairs()
      .value();
  }
  return newItemsForSpecType[spec.type];
}

const fieldComponents = {
  boolean: BooleanField,
  coords: CoordsField,
  email: EmailField,
  enum: EnumField,
  lookupable: LookupableField,
  markdown: MarkdownField,
  media: MediaField,
  name: NameField,
  number: NumberField,
  reference: ReferenceField,
  simpleAttribute: SimpleAttributeField,
  simpleValue: SimpleValueField,
  string: StringField,
  timeOffset: TimeOffsetField,
  timeShorthand: TimeShorthandField
};

export default class FieldRenderer {
  constructor(script, resource, isNew, onPropUpdate, onArrayUpdate) {
    this.script = script;
    this.resource = resource;
    this.isNew = isNew;
    this.onPropUpdate = onPropUpdate;
    this.onArrayUpdate = onArrayUpdate;
  }

  renderFieldValue(spec, value, name, path, opts) {
    const fieldType = spec.type;
    if (fieldComponents[fieldType]) {
      const Component = fieldComponents[fieldType];
      return (
        <Component
          script={this.script}
          resource={this.resource}
          spec={spec}
          value={value}
          name={name}
          path={path}
          opts={opts}
          onPropUpdate={this.onPropUpdate} />
      );
    }
    const rendererKey = `render${_.upperFirst(fieldType)}`;
    if (!this[rendererKey]) {
      return `??? (${fieldType})`;
    }
    const fieldRenderer = this[rendererKey].bind(this);
    return fieldRenderer(spec, value, name, path, opts);
  }

  renderListItem(spec, value, name, path, opts, item, index) {
    const itemPath = `${path}[${index}]`;
    const rmBtn = (
      <button
        className="btn btn-sm btn-outline-secondary"
        onClick={() => this.onArrayUpdate(path, index, null)}>
        <i className="fa fa-minus" />
      </button>
    );
    return (
      // eslint-disable-next-line react/no-array-index-key
      <div key={index}>
        <div style={{ float: 'left' }}>
          {rmBtn}
        </div>
        <div style={{ marginLeft: '2em' }}>
          {this.renderFieldValue(spec.items, item, `${name} Item`, itemPath,
            opts)}
        </div>
      </div>
    );
  }

  renderList(spec, value, name, path, opts) {
    const items = _.map(value, (item, i) => (
      this.renderListItem(spec, value, name, path, opts, item, i)
    ));
    const listIsEmpty = !value || value.length === 0;
    const newIndex = value ? value.length : 0;
    const newPath = `${path}[${newIndex}]`;
    const newItem = newItemForSpec(spec.items);
    const newBtnStyle = { display: listIsEmpty ? 'inline' : 'block' };
    const newItemBtn = (
      <div style={newBtnStyle}>
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => this.onPropUpdate(newPath, newItem)}>
          <i className="fa fa-plus" />
        </button>
      </div>
    );
    return (
      <div style={newBtnStyle}>
        {items}
        {newItemBtn}
      </div>
    );
  }

  renderDictionary(spec, value, name, path, opts) {
    const items = _.map(value, (val, key) => (
      // eslint-disable-next-line react/no-array-index-key
      <div key={key}>
        <button
          onClick={() => this.onPropUpdate(`${path}[${key}]`, null)}
          className="btn btn-xs btn-outline-secondary">
          <i className="fa fa-minus" />
        </button>
        &nbsp;
        {this.renderFieldValue(spec.keys, key, `${name} Key`,
          'INVALID', { editable: false })}:&nbsp;
        {this.renderFieldValue(spec.values, val, `${name} Value`,
          `${path}[${key}]`)}
        <BaseClear
          spec={spec}
          value={val}
          path={`${path}[${key}]`}
          onPropUpdate={this.onPropUpdate} />
      </div>
    ));
    const newItem = newItemsForSpecType[spec.values.type];
    const newItemField = this.renderFieldValue(
      spec.keys, 'New item', `${name} New Key`, 'INVALID', {
        onConfirm: val => this.onPropUpdate(`${path}[${val}]`, newItem)
      }
    );
    const newItemBtn = (
      <div>
        <button className="btn btn-xs btn-outline-secondary disabled">
          <i className="fa fa-plus" />
        </button>
        &nbsp;
        {newItemField}
      </div>
    );
    return (
      <div>
        {items}
        {newItemBtn}
      </div>
    );
  }

  internalLabel(spec, key) {
    const shouldShowLabel = _.get(spec, 'display.label') !== false;
    if (!shouldShowLabel) {
      return null;
    }
    const labelText = labelForSpec(spec, key);
    return (
      <LabelWithTip label={labelText} identifier={key} help={spec.help} />
    );
  }

  internalObjectKey(spec, value, name, path, opts, keySpec, key) {
    // Hide hidden fields
    if (_.get(keySpec, 'display.hidden')) {
      return null;
    }
    // Hide optional references if no objects exist in that reference.
    if (keySpec.type === 'reference' && !keySpec.required && !value[key]) {
      const collectionName = keySpec.collection;
      const collection = this.script.content[collectionName];
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
    const itemPath = `${path}${path ? '.' : ''}${key}`;
    const isSimpleType = !_.includes(COMPLEX_TYPES, keySpec.type);
    const itemValue = _.get(value, key);

    let invalidWarning = null;
    if (isSimpleType) {
      if (_.isNull(itemValue) || _.isUndefined(itemValue)) {
        if (keySpec.required) {
          invalidWarning = (
            <i className="fa fa-exclamation-circle text-danger ml-1" />
          );
        }
      } else {
        const validatorErrors = validator.validateParam(this.script,
          name, keySpec, itemValue);
        if (validatorErrors && validatorErrors.length > 0) {
          invalidWarning = (
            <i className="fa fa-exclamation-circle text-danger ml-1" />
          );
        }
      }
    }

    const shouldShowClear = isSimpleType && keySpec.type !== 'boolean';
    const clear = shouldShowClear ? (
      <BaseClear
        spec={keySpec}
        value={itemValue}
        path={itemPath}
        onPropUpdate={this.onPropUpdate} />
    ) : null;
    return (
      <div key={key} style={itemStyle} className="object-key">
        {this.internalLabel(keySpec, key)}
        {this.renderFieldValue(keySpec, itemValue, _.startCase(key),
          itemPath, optsWithInline)}
        {clear}
        {invalidWarning}
      </div>
    );
  }

  renderObject(spec, value, name, path, opts) {
    const props = _(Object.keys(spec.properties))
      .sortBy(key => !!_.get(spec.properties[key], 'display.last'))
      .value();
    const renderedItems = _.map(props, key => (
      this.internalObjectKey(spec, value, name, path, opts,
        spec.properties[key], key)
    ));
    const isInline = (
      _.get(spec, 'display.form') === 'inline' ||
      _.get(opts, 'inline')
    );
    const divStyle = isInline ? { display: 'inline-block' } : {};
    return (
      <div style={divStyle} className="object">
        {renderedItems}
      </div>
    );
  }

  renderComponent(spec, value, name, path, opts) {
    const variety = validator.getComponentVariety(spec, value);
    const varietyClass = validator.getComponentClass(spec, variety);
    const properties = Object.keys(varietyClass.properties);
    if (properties.length === 1 && properties[0] === 'self') {
      return this.renderFieldValue(varietyClass.properties.self, value,
        name, path);
    }
    return this.renderObject(varietyClass, value, name, path, opts);
  }
}
