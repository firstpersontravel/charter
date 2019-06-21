import _ from 'lodash';
import React from 'react';

import { ConditionCore, TextUtil, ValidationCore } from 'fptcore';

import { titleForResource } from '../utils/text-utils';
import { labelForSpec } from '../utils/spec-utils';
import PopoverControl from '../../partials/PopoverControl';
import ResourceBadge from './ResourceBadge';
import LabelWithTip from './LabelWithTip';
import { defaultForSpec, doesSpecHaveDefault } from '../utils/resource-utils';

const COMPLEX_TYPES = ['dictionary', 'object', 'list', 'variegated'];

const booleanLabels = ['No', 'Yes'];

function isEmpty(warnings) {
  if (!warnings) {
    return true;
  }
  if (warnings.length === 0) {
    return true;
  }
  return false;
}

function stringOrYesNo(val) {
  if (_.isBoolean(val)) {
    return booleanLabels[Number(val)];
  }
  return val.toString();
}

function internalEmpty(spec) {
  const nullIsNone = (
    spec.type === 'reference' ||
    spec.type === 'timeOffset'
  );
  const nullText = nullIsNone ? 'None' : 'Empty';
  let label = _.get(spec, 'display.placeholder') || nullText;
  if (spec.type === 'media') {
    label = 'Enter a path (i.e. "sound.mp3", "img.jpg"). Save, then upload content.';
  } else if (doesSpecHaveDefault(spec)) {
    label = `${stringOrYesNo(defaultForSpec(spec))} by default`;
  }
  return (
    <em className="faint">{label}</em>
  );
}

function defaultIfForOp(op) {
  // Need default item for not, otherwise will error when showing choice.
  if (op === 'not') {
    return { op: 'not', item: { op: '' } };
  }
  return { op: op };
}

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
  ifClause: { op: '' },
  markdown: '',
  dictionary: {},
  list: [],
  object: {},
  variegated: {}
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

export default class FieldRenderer {
  constructor(script, resource, isNew, onPropUpdate, onArrayUpdate) {
    this.script = script;
    this.resource = resource;
    this.isNew = isNew;
    this.onPropUpdate = onPropUpdate;
    this.onArrayUpdate = onArrayUpdate;
  }

  internalStringlike(spec, value, name, path, opts, validate, clean) {
    const validateFunc = validate || (val => true);
    const cleanFunc = clean || (val => val);
    const allowNewlines = spec.type === 'markdown';
    const textLabel = allowNewlines ? (
      <div style={{ whiteSpace: 'pre-wrap' }}>{value}</div>
    ) : value;
    const label = value ? textLabel : internalEmpty(spec);
    if (opts && opts.editable === false) {
      return value;
    }
    // Special overrides just for dictionary keys
    const onConfirm = (opts && opts.onConfirm) ||
      (val => this.onPropUpdate(path, cleanFunc(val)));
    return (
      <PopoverControl
        title={name}
        validate={validateFunc}
        helpText={spec.help}
        onConfirm={onConfirm}
        label={label}
        value={value || ''} />
    );
  }

  internalEnumlike(spec, value, name, path, opts, choices, clean, label) {
    const cleanFunc = clean || (val => val);
    if (opts && opts.editable === false) {
      return value;
    }
    // Special hack for 'type' params.
    const onEnumUpdate = (val) => {
      // Special overrides just for dictionary keys
      if (opts && opts.onConfirm) {
        opts.onConfirm(val);
        return;
      }
      // Special handling of event type,
      if (_.startsWith(path, 'events') && _.endsWith(path, '.type')) {
        // Clear out other values.
        this.onPropUpdate(path.replace(/\.type$/, ''), { type: cleanFunc(val) });
        return;
      }
      // And special handling of action name.
      if (_.startsWith(path, 'actions') && _.endsWith(path, '.name')) {
        // Clear out other values.
        this.onPropUpdate(path.replace(/\.name$/, ''), { name: cleanFunc(val) });
        return;
      }
      this.onPropUpdate(path, cleanFunc(val));
    };
    return (
      <PopoverControl
        title={name}
        choices={choices}
        helpText={spec.help}
        onConfirm={onEnumUpdate}
        label={label || value || internalEmpty(spec)}
        value={value} />
    );
  }

  internalClear(spec, value, path) {
    const shouldAllowClear = !spec.required &&
      !spec.parent &&
      !_.isUndefined(value) &&
      !_.isNull(value);
    if (!shouldAllowClear) {
      return null;
    }
    return (
      <span>
        &nbsp;
        <button
          className="btn-unstyled clear-btn faint"
          onClick={() => this.onPropUpdate(path, null)}>
          <i className="fa fa-close" />
        </button>
      </span>
    );
  }

  renderFieldValue(spec, value, name, path, opts) {
    const fieldType = spec.type;
    const rendererKey = `render${_.upperFirst(fieldType)}`;
    if (!this[rendererKey]) {
      return `??? (${fieldType})`;
    }
    const fieldRenderer = this[rendererKey].bind(this);
    return fieldRenderer(spec, value, name, path, opts);
  }

  renderNumber(spec, value, name, path, opts) {
    const validate = (val => !isNaN(Number(val)));
    const clean = (val => Number(val));
    return this.internalStringlike(spec, value, name, path, opts, validate,
      clean);
  }

  renderString(spec, value, name, path, opts) {
    return this.internalStringlike(spec, value, name, path, opts);
  }

  renderEmail(spec, value, name, path, opts) {
    const validate = val => (
      isEmpty(ValidationCore.email(this.script, name, spec, val))
    );
    const clean = val => val;
    return this.internalStringlike(spec, value, name, path, opts, validate, clean);
  }

  renderMarkdown(spec, value, name, path, opts) {
    return this.internalStringlike(spec, value, name, path, opts);
  }

  renderSimpleValue(spec, value, name, path, opts) {
    const existing = value.toString();
    const validate = val => true;
    const clean = (val) => {
      if (val === 'true') { return true; }
      if (val === 'false') { return true; }
      if (!isNaN(Number(val))) { return Number(val); }
      return val;
    };
    return this.internalStringlike(spec, existing, name, path, opts, validate,
      clean);
  }

  // Aliases
  renderName(spec, value, name, path, opts) {
    const validate = val => (
      isEmpty(ValidationCore.name(this.script, name, spec, val))
    );
    const clean = val => val;
    return this.internalStringlike(spec, value, name, path, opts, validate, clean);
  }

  renderTimeOffset(spec, value, name, path, opts) {
    const validate = val => (
      isEmpty(ValidationCore.timeOffset(this.script, name, spec, val))
    );
    const clean = val => val;
    return this.internalStringlike(spec, value, name, path, opts, validate, clean);
  }

  renderLookupable(spec, value, name, path, opts) {
    const validate = val => (
      isEmpty(ValidationCore.lookupable(this.script, name, spec, val))
    );
    const clean = val => val;
    return this.internalStringlike(spec, value, name, path, opts, validate, clean);
  }

  renderSimpleAttribute(spec, value, name, path, opts) {
    const validate = val => (
      isEmpty(ValidationCore.simpleAttribute(this.script, name, spec, val))
    );
    const clean = val => val;
    return this.internalStringlike(spec, value, name, path, opts, validate, clean);
  }

  renderMedia(spec, value, name, path, opts) {
    const validate = val => (
      isEmpty(ValidationCore.media(this.script, name, spec, val))
    );
    const clean = val => val;
    return this.internalStringlike(spec, value, name, path, opts, validate, clean);
  }

  renderTimeShorthand(spec, value, name, path, opts) {
    const validate = val => (
      isEmpty(ValidationCore.timeShorthand(this.script, name, spec, val))
    );
    const clean = val => val;
    return this.internalStringlike(spec, value, name, path, opts, validate, clean);
  }

  renderIfClause(spec, value, name, path, opts) {
    if (!value) {
      const choices = [{ value: '', label: '---' }]
        .concat(Object.keys(ConditionCore.ifOpClasses).map(op => ({
          value: op,
          label: op
        })));
      const clean = val => (val === '' ? null : defaultIfForOp(val));
      const label = <em className="faint">Always</em>;
      return this.internalEnumlike(spec, '', name, path, opts,
        choices, clean, label);
    }
    const inlineOpts = Object.assign({}, opts);
    const inlineStyle = {};
    if (_.includes(['and', 'or'], value.op)) {
      inlineOpts.inline = false;
      inlineOpts.insideCompoundIf = true;
      if (!_.get(opts, 'insideCompoundIf')) {
        inlineStyle.paddingLeft = '1em';
      }
    } else {
      inlineOpts.inline = true;
      inlineStyle.display = 'inline-block';
    }
    return (
      <div className="ifClause" style={inlineStyle}>
        {this.renderFieldValue(ConditionCore.ifSpec, value, name, path, inlineOpts)}
      </div>
    );
  }

  // eslint-disable-next-line class-methods-use-this
  renderCoords(spec, value, name, path, opts) {
    const asText = value ?
      `${value[0].toFixed(6)}, ${value[1].toFixed(6)}` :
      '';
    const textToCoords = val => val.split(',').map(v => Number(v));
    const validate = (val) => {
      const coords = textToCoords(val);
      return (
        coords.length === 2 &&
        coords[0] &&
        coords[1] &&
        !isNaN(Number(coords[0])) &&
        !isNaN(Number(coords[1]))
      );
    };
    const clean = val => textToCoords(val);
    const label = value || internalEmpty(spec);
    return this.internalStringlike(spec, asText, name, path, opts, validate, clean, label);
  }

  renderEnum(spec, value, name, path, opts) {
    const choices = spec.options.map(opt => ({ value: opt, label: opt }));
    if (value === null || value === undefined || value === '') {
      choices.unshift({ value: '', label: '---' });
    }
    const label = value ? (
      <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
        {value}
      </span>
    ) : internalEmpty(spec);
    return this.internalEnumlike(spec, value || '', name, path, opts,
      choices, null, label);
  }

  renderBoolean(spec, value, name, path, opts) {
    const style = _.isUndefined(value) ? { opacity: 0.5 } : {};
    const def = doesSpecHaveDefault(spec) ? defaultForSpec(spec) : false;
    const existing = _.isUndefined(value) ? def : value;
    return (
      <input
        style={style}
        type="checkbox"
        checked={existing}
        onChange={(e) => {
          this.onPropUpdate(path, e.target.checked);
        }} />
    );
  }

  renderReference(spec, value, name, path, opts) {
    let label = internalEmpty(spec);
    const collection = this.script.content[spec.collection];
    const resource = _.find(collection, { name: value });

    if (resource) {
      const resourceType = TextUtil.singularize(spec.collection);
      const title = titleForResource(this.script.content, spec.collection,
        resource);
      label = (
        <span style={{ whiteSpace: 'nowrap' }}>
          <ResourceBadge resourceType={resourceType} showType={false} />
          &nbsp;{title}
        </span>
      );
    } else if (value === 'null') {
      label = 'None';
    }

    if (opts && opts.editable === false) {
      return label;
    }

    const filtered = _.filter(collection, (rel) => {
      // Hacky filtering by scene.
      if (rel.scene && this.resource.scene &&
        rel.scene !== this.resource.scene) {
        return false;
      }
      // Hacky filtering by role for pages / appearances.
      if (rel.role && this.resource.role &&
        rel.role !== this.resource.role) {
        return false;
      }
      return true;
    });
    const existing = value || '';
    const clean = (val => (val === '' ? null : val));
    const nullChoices = [{ value: '', label: '---' }];
    if (spec.allowNull) {
      nullChoices.push({ value: 'null', label: 'None' });
    }
    const choices = nullChoices.concat(filtered.map(rel => ({
      value: rel.name,
      label: titleForResource(this.script.content, spec.collection, rel)
    })));

    return this.internalEnumlike(spec, existing, name, path, opts, choices,
      clean, label);
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
        {this.internalClear(spec, val, `${path}[${key}]`)}
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
        const validatorErrors = ValidationCore[keySpec.type](this.script,
          name, keySpec, itemValue);
        if (validatorErrors && validatorErrors.length > 0) {
          invalidWarning = (
            <i className="fa fa-exclamation-circle text-danger ml-1" />
          );
        }
      }
    }

    const shouldShowClear = isSimpleType && keySpec.type !== 'boolean';
    const clear = shouldShowClear ?
      this.internalClear(keySpec, itemValue, itemPath) :
      null;
    return (
      <div key={key} style={itemStyle} className="object-key">
        {this.internalLabel(keySpec, key)}
        {this.renderFieldValue(keySpec, itemValue, _.startCase(key),
          itemPath, opts)}
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

  renderVariegated(spec, value, name, path, opts) {
    const variety = ValidationCore.getVariegatedVariety(spec, value);
    const varietyClass = ValidationCore.getVariegatedClass(spec, variety);
    const properties = Object.keys(varietyClass.properties);
    if (properties.length === 1 && properties[0] === 'self') {
      return this.renderFieldValue(varietyClass.properties.self, value,
        name, path);
    }
    return this.renderObject(varietyClass, value, name, path, opts);
  }
}
