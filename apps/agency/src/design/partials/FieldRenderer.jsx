import _ from 'lodash';
import React from 'react';

import { TextUtil, ParamValidators } from 'fptcore';

import { titleForResource } from '../utils/text-utils';
import PopoverControl from '../../partials/PopoverControl';
import ResourceBadge from './ResourceBadge';

const COMPLEX_TYPES = ['dictionary', 'object', 'subresource', 'list',
  'variegated'];

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
  let label = _.get(spec, 'display.placeholder') || 'Empty';
  if (spec.type === 'ifClause') {
    label = 'Always';
  }
  if (!_.isUndefined(spec.default)) {
    label = `${stringOrYesNo(spec.default)} by default`;
  }
  return (
    <em className="faint">{label}</em>
  );
}

function labelForSpec(spec, key) {
  if (spec.title) {
    return spec.title;
  }
  let simpleKey = key.replace('_name', '');
  if (spec.type === 'reference') {
    const resourceType = TextUtil.singularize(spec.collection);
    simpleKey = simpleKey.replace(`_${resourceType}`, '');
  }
  return _.startCase(simpleKey);
}

const newItemsForSpecType = {
  string: '',
  simpleValue: '',
  number: 0,
  boolean: null,
  enum: '',
  duration: '',
  name: '',
  media: '',
  coords: '',
  timeShorthand: '',
  simpleAttribute: '',
  nestedAttribute: '',
  lookupable: '',
  reference: '',
  ifClause: '',
  dictionary: {},
  list: [],
  object: {},
  subresource: {},
  variegated: {}
};

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
    const allowNewlines = !!_.get(spec, 'display.allowNewlines');
    const textLabel = allowNewlines ? (
      <div style={{ whiteSpace: 'pre' }}>{value}</div>
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
        onConfirm={onEnumUpdate}
        label={label || value || internalEmpty(spec)}
        value={value || choices[0].value} />
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
      isEmpty(ParamValidators.name(this.script, name, spec, val))
    );
    const clean = val => val;
    return this.internalStringlike(spec, value, name, path, opts, validate, clean);
  }

  renderDuration(spec, value, name, path, opts) {
    const validate = val => (
      isEmpty(ParamValidators.duration(this.script, name, spec, val))
    );
    const clean = val => val;
    return this.internalStringlike(spec, value, name, path, opts, validate, clean);
  }

  renderLookupable(spec, value, name, path, opts) {
    const validate = val => (
      isEmpty(ParamValidators.lookupable(this.script, name, spec, val))
    );
    const clean = val => val;
    return this.internalStringlike(spec, value, name, path, opts, validate, clean);
  }

  renderNestedAttribute(spec, value, name, path, opts) {
    const validate = val => (
      isEmpty(ParamValidators.nestedAttribute(this.script, name, spec, val))
    );
    const clean = val => val;
    return this.internalStringlike(spec, value, name, path, opts, validate, clean);
  }

  renderSimpleAttribute(spec, value, name, path, opts) {
    const validate = val => (
      isEmpty(ParamValidators.simpleAttribute(this.script, name, spec, val))
    );
    const clean = val => val;
    return this.internalStringlike(spec, value, name, path, opts, validate, clean);
  }

  renderMedia(spec, value, name, path, opts) {
    const validate = val => (
      isEmpty(ParamValidators.media(this.script, name, spec, val))
    );
    const clean = val => val;
    return this.internalStringlike(spec, value, name, path, opts, validate, clean);
  }

  renderTimeShorthand(spec, value, name, path, opts) {
    const validate = val => (
      isEmpty(ParamValidators.timeShorthand(this.script, name, spec, val))
    );
    const clean = val => val;
    return this.internalStringlike(spec, value, name, path, opts, validate, clean);
  }

  renderIfClause(spec, value, name, path, opts) {
    const validate = val => (
      isEmpty(ParamValidators.ifClause(this.script, name, spec, val))
    );
    const clean = val => val;
    return this.internalStringlike(spec, value, name, path, opts, validate, clean);
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
    const label = (
      <span style={{ whiteSpace: 'nowrap' }}>
        {value || internalEmpty(spec)}
      </span>
    );
    return this.internalEnumlike(spec, value, name, path, opts, choices, null,
      label);
  }

  renderBoolean(spec, value, name, path, opts) {
    const choices = ['Yes', 'No'];
    // eslint-disable-next-line no-nested-ternary
    const existing = value ? 'Yes' : 'No';
    const label = _.isUndefined(value) ? internalEmpty(spec) : existing;
    const clean = val => val === 'Yes';
    return this.internalEnumlike(spec, existing, name, path, opts, choices,
      clean, label);
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
          <ResourceBadge resourceType={resourceType} />
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

  renderList(spec, value, name, path, opts) {
    const items = _.map(value, (item, i) => {
      const itemPath = `${path}[${i}]`;
      const rmBtn = (
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => this.onArrayUpdate(path, i, null)}>
          <i className="fa fa-minus" />
        </button>
      );
      return (
        // eslint-disable-next-line react/no-array-index-key
        <div key={i}>
          <div style={{ float: 'left' }}>
            {rmBtn}
          </div>
          <div style={{ marginLeft: '2em' }}>
            {this.renderFieldValue(spec.items, item, `${name} Item`, itemPath)}
          </div>
        </div>
      );
    });
    const listIsEmpty = !value || value.length === 0;
    const newIndex = value ? value.length : 0;
    const newPath = `${path}[${newIndex}]`;
    const newItem = newItemsForSpecType[spec.items.type];
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
    const newItemBtn = (
      <div>
        <button className="btn btn-xs btn-outline-secondary disabled">
          <i className="fa fa-plus" />
        </button>
        &nbsp;
        {this.renderFieldValue(spec.keys, 'New item', `${name} New Key`,
          'INVALID', { onConfirm: (val) => {
            this.onPropUpdate(`${path}[${val}]`, newItem);
          } })}
      </div>
    );
    return (
      <div>
        {items}
        {newItemBtn}
      </div>
    );
  }

  internalObjectKey(spec, value, name, path, opts, keySpec, key) {
    if (_.get(keySpec, 'display.hidden')) {
      return null;
    }

    const isInline = _.get(spec, 'display.form') === 'inline';
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
            <i
              style={{ marginLeft: '0.25em' }}
              className="fa fa-exclamation-circle text-danger" />
          );
        }
      } else {
        const validatorErrors = ParamValidators[keySpec.type](this.script,
          name, keySpec, itemValue);
        if (validatorErrors && validatorErrors.length > 0) {
          invalidWarning = (
            <i
              style={{ marginLeft: '0.25em' }}
              className="fa fa-exclamation-circle text-danger" />
          );
        }
      }
    }

    const shouldShowLabel = !_.get(keySpec, 'display.primary');
    const labelText = labelForSpec(keySpec, key);
    const label = shouldShowLabel ? (
      <strong style={{ marginRight: '0.25em' }}>
        {labelText}:
      </strong>
    ) : null;

    return (
      // eslint-disable-next-line react/no-array-index-key
      <div key={key} style={itemStyle}>
        {label}
        {this.renderFieldValue(keySpec, itemValue, _.startCase(key),
          itemPath)}
        {isSimpleType ?
          this.internalClear(keySpec, itemValue, itemPath) : null}
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
    return (
      <div>
        {renderedItems}
      </div>
    );
  }

  renderSubresource(spec, value, name, path, opts) {
    const properties = Object.keys(spec.class.properties);
    if (properties.length === 1 && properties[0] === 'self') {
      return this.renderFieldValue(spec.class.properties.self, value,
        name, path);
    }
    return this.renderObject(spec.class, value, name, path, opts);
  }

  renderVariegated(spec, value, name, path, opts) {
    const variety = _.isFunction(spec.key) ? spec.key(value) : value[spec.key];
    const commonClass = spec.common;
    const varietyClass = spec.classes[variety];
    const mergedClass = _.merge({}, commonClass, varietyClass);
    return this.renderSubresource({ class: mergedClass }, value, name, path,
      opts);
  }
}
