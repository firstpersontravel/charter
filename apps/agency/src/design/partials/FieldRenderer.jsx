import _ from 'lodash';
import React from 'react';

import { TextUtil, ParamValidators } from 'fptcore';

import { titleForResource } from '../utils/text-utils';
import PopoverControl from '../../partials/PopoverControl';

const booleanLabels = ['No', 'Yes'];

function stringOrYesNo(val) {
  if (_.isBoolean(val)) {
    return booleanLabels[Number(val)];
  }
  return val.toString();
}

function internalEmpty(spec) {
  let label = 'Empty';
  if (!_.isUndefined(spec.default)) {
    label = `${stringOrYesNo(spec.default)} by default`;
  }
  return (
    <em className="faint">{label}</em>
  );
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
    const label = value || internalEmpty(spec);
    if (opts && opts.editable === false) {
      return value;
    }
    return (
      <PopoverControl
        title={name}
        validate={validateFunc}
        onConfirm={val => this.onPropUpdate(path, cleanFunc(val))}
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
    const validate = val => true;
    const clean = val => val;
    return this.internalStringlike(spec, value, name, path, opts, validate, clean);
  }

  renderDuration(spec, value, name, path, opts) {
    const validate = val => true;
    const clean = val => val;
    return this.internalStringlike(spec, value, name, path, opts, validate, clean);
  }

  renderLookupable(spec, value, name, path, opts) {
    const validate = val => true;
    const clean = val => val;
    return this.internalStringlike(spec, value, name, path, opts, validate, clean);
  }

  renderNestedAttribute(spec, value, name, path, opts) {
    const validate = val => true;
    const clean = val => val;
    return this.internalStringlike(spec, value, name, path, opts, validate, clean);
  }

  renderSimpleAttribute(spec, value, name, path, opts) {
    const validate = val => true;
    const clean = val => val;
    return this.internalStringlike(spec, value, name, path, opts, validate, clean);
  }

  renderMedia(spec, value, name, path, opts) {
    const validate = val => true;
    const clean = val => val;
    return this.internalStringlike(spec, value, name, path, opts, validate, clean);
  }

  renderTimeShorthand(spec, value, name, path, opts) {
    const validate = val => true;
    const clean = val => val;
    return this.internalStringlike(spec, value, name, path, opts, validate, clean);
  }

  renderIfClause(spec, value, name, path, opts) {
    const validate = val => true;
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
    return this.internalEnumlike(spec, value, name, path, opts, choices);
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
      const title = titleForResource(this.script.content, spec.collection,
        resource);
      label = (
        <span>
          <span className="badge badge-secondary">
            {TextUtil.titleForKey(TextUtil.singularize(spec.collection))}
          </span>&nbsp;
          {title}
        </span>
      );
    } else if (value === 'null') {
      label = 'None';
    }

    // If the reference is a parent, then can't change after creation.
    if ((spec.parent && !this.isNew) ||
        (opts && opts.editable === false)) {
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
    const newIndex = value ? value.length : 0;
    const newPath = `${path}[${newIndex}]`;
    const newItem = newItemsForSpecType[spec.items.type];
    const newItemBtn = (
      <div>
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => this.onPropUpdate(newPath, newItem)}>
          <i className="fa fa-plus" />
        </button>
      </div>
    );
    return (
      <div>
        {items}
        {newItemBtn}
      </div>
    );
  }

  renderDictionary(spec, value, name, path, opts) {
    const items = _.map(value, (val, key) => (
      // eslint-disable-next-line react/no-array-index-key
      <li key={key}>
        {this.renderFieldValue(spec.keys, key, `${name} Key`,
          'INVALID', { editable: false })}:&nbsp;
        {this.renderFieldValue(spec.values, val, `${name} Value`,
          `${path}[${key}]`)}
        {this.internalClear(spec, val, `${path}[${key}]`)}
      </li>
    ));
    return (
      <ul>
        {items}
      </ul>
    );
  }

  renderObject(spec, value, name, path, opts) {
    const COMPLEX_TYPES = ['dictionary', 'object', 'subresource', 'list',
      'variegated'];
    const items = _.map(spec.properties, (keySpec, key) => {
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
      return (
        // eslint-disable-next-line react/no-array-index-key
        <div key={key}>
          <strong>{_.startCase(key)}:</strong>&nbsp;
          {this.renderFieldValue(keySpec, itemValue, _.startCase(key),
            itemPath)}
          {isSimpleType ?
            this.internalClear(keySpec, itemValue, itemPath) : null}
          {invalidWarning}
        </div>
      );
    });
    return (
      <div>
        {items}
      </div>
    );
  }

  renderSubresource(spec, value, name, path, opts) {
    const properties = Object.keys(spec.class.properties);
    if (properties.length === 1 && properties[0] === 'self') {
      return this.renderFieldValue(spec.class.properties.self, value,
        name, path);
    }
    return this.renderObject(spec.class, value, name, path);
  }

  renderVariegated(spec, value, name, path, opts) {
    const variety = _.isFunction(spec.key) ? spec.key(value) : value[spec.key];
    const commonClass = spec.common;
    const varietyClass = spec.classes[variety];
    const mergedClass = _.merge({}, commonClass, varietyClass);
    return this.renderSubresource({ class: mergedClass }, value, name, path);
  }
}
