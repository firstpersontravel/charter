import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

import { ResourcesRegistry, TextUtil, ParamValidators } from 'fptcore';

import { titleForResource } from '../utils/text-utils';
import { getChildResourceTypes } from '../utils/graph-utils';
import PopoverControl from '../../partials/PopoverControl';

// Hide title, field, and name
const HIDE_FIELD_NAMES = ['name', 'title', 'scene'];

const booleanLabels = ['No', 'Yes'];
const highlight = (
  <span className="text-danger">
    &nbsp;<i className="fa fa-exclamation-circle" />
  </span>
);

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

class Renderer {
  constructor(script, resource, isNew, onUpdate) {
    this.script = script;
    this.resource = resource;
    this.isNew = isNew;
    this.onUpdate = onUpdate;
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
        onConfirm={val => this.onUpdate(path, cleanFunc(val))}
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
    const onUpdate = (val) => {
      // Special handling of event type,
      if (_.startsWith(path, 'events') && _.endsWith(path, '.type')) {
        // Clear out other values.
        this.onUpdate(path.replace(/\.type$/, ''), { type: cleanFunc(val) });
        return;
      }
      // And special handling of action name.
      if (_.startsWith(path, 'actions') && _.endsWith(path, '.name')) {
        // Clear out other values.
        this.onUpdate(path.replace(/\.name$/, ''), { name: cleanFunc(val) });
        return;
      }
      this.onUpdate(path, cleanFunc(val));
    };
    return (
      <PopoverControl
        title={name}
        choices={choices}
        onConfirm={onUpdate}
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
          onClick={() => this.onUpdate(path, null)}>
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
  renderName(...args) { return this.renderString(...args); }
  renderDuration(...args) { return this.renderString(...args); }
  renderLookupable(...args) { return this.renderString(...args); }
  renderNestedAttribute(...args) { return this.renderString(...args); }
  renderSimpleAttribute(...args) { return this.renderString(...args); }
  renderMedia(...args) { return this.renderString(...args); }
  renderTimeShorthand(...args) { return this.renderString(...args); }

  renderIfClause(spec, value, name, path, opts) {
    return this.renderString(spec, value, name, path, opts);
  }

  // eslint-disable-next-line class-methods-use-this
  renderCoords(spec, value, name, path, opts) {
    return `${value[0].toFixed(3)}, ${value[1].toFixed(3)}`;
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
    const items = _.map(value, (item, i) => (
      // eslint-disable-next-line react/no-array-index-key
      <li key={i}>
        {this.renderFieldValue(spec.items, item, `${name} Item`,
          `${path}[${i}]`)}
      </li>
    ));
    return (
      <ul>
        {items}
      </ul>
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
      const allowClear = !_.includes(COMPLEX_TYPES, keySpec.type);
      const itemValue = _.get(value, key);
      return (
        // eslint-disable-next-line react/no-array-index-key
        <div key={key}>
          <strong>{_.startCase(key)}:</strong>&nbsp;
          {this.renderFieldValue(keySpec, itemValue, _.startCase(key),
            itemPath)}
          {allowClear ?
            this.internalClear(keySpec, itemValue, itemPath) : null}
          {!itemValue && keySpec.required ? highlight : null}
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

export default class ResourceView extends Component {

  constructor(props) {
    super(props);
    const pendingResource = _.cloneDeep(props.resource);
    this.state = {
      isConfirmingDelete: false,
      hasPendingChanges: false,
      pendingResource: pendingResource,
      errors: ParamValidators.validateResource(
        props.script,
        ResourcesRegistry[TextUtil.singularize(props.collectionName)],
        pendingResource, '')
    };
    this.handleDelete = this.handleDelete.bind(this);
    this.handleDeleteConfirm = this.handleDeleteConfirm.bind(this);
    this.handleRevertChanges = this.handleRevertChanges.bind(this);
    this.handleApplyChanges = this.handleApplyChanges.bind(this);
    this.handlePropertyUpdate = this.handlePropertyUpdate.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.resource !== this.props.resource) {
      const pendingResource = _.cloneDeep(nextProps.resource);
      this.setState({
        isConfirmingDelete: false,
        hasPendingChanges: false,
        pendingResource: pendingResource,
        errors: ParamValidators.validateResource(
          nextProps.script,
          ResourcesRegistry[TextUtil.singularize(nextProps.collectionName)],
          pendingResource, '')
      });
    }
  }

  getResourceClass() {
    return ResourcesRegistry[TextUtil.singularize(this.props.collectionName)];
  }

  getFieldNames() {
    return _.without(
      Object.keys(this.getResourceClass().properties),
      ...HIDE_FIELD_NAMES);
  }

  handleApplyChanges() {
    // if (!this.state.hasPendingChanges) {
    //   return;
    // }
    if (this.state.errors && this.state.errors.length > 0) {
      return;
    }
    this.props.onUpdate(this.state.pendingResource);
  }

  handleRevertChanges() {
    this.setState({
      hasPendingChanges: false,
      pendingResource: _.cloneDeep(this.props.resource),
      errors: null
    });
  }

  handleDelete() {
    if (!this.props.canDelete) {
      return;
    }
    this.setState({ isConfirmingDelete: true });
  }

  handleDeleteConfirm() {
    if (!this.props.canDelete) {
      return;
    }
    this.props.onDelete();
  }

  handlePropertyUpdate(path, newValue) {
    console.log('handlePropertyUpdate', path, newValue);
    const newResource = _.cloneDeep(this.state.pendingResource);
    if (newValue !== null) {
      _.set(newResource, path, newValue);
    } else {
      _.unset(newResource, path);
    }
    this.setState({
      pendingResource: newResource,
      hasPendingChanges: true,
      errors: ParamValidators.validateResource(
        this.props.script,
        ResourcesRegistry[TextUtil.singularize(this.props.collectionName)],
        newResource, '')
    });
  }

  renderHeader() {
    const resourceType = TextUtil.singularize(this.props.collectionName);
    const resource = this.props.resource;
    const script = this.props.script;

    const isNew = this.props.isNew;
    const hasPendingChanges = this.state.hasPendingChanges;
    const hasErrors = this.state.errors && this.state.errors.length > 0;
    const canDelete = this.props.canDelete && !hasPendingChanges;
    const showApply = hasPendingChanges || isNew;
    const canApply = !hasErrors;

    const deleteBtnClass = `btn btn-sm btn-outline-secondary ${canDelete ? '' : 'disabled'}`;
    const deleteBtn = (
      <button
        className={deleteBtnClass}
        onClick={(this.handleDelete)}>
        <i className="fa fa-trash-o" />&nbsp;
        {canDelete ? 'Delete' : 'Can\'t delete'}
      </button>
    );
    const confirmDeleteBtn = (
      <button
        className="btn btn-sm btn-danger"
        onClick={this.handleDeleteConfirm}>
        <i className="fa fa-trash-o" />&nbsp;
        Confirm delete
      </button>
    );
    const deleteBtnToShow = this.state.isConfirmingDelete ?
      confirmDeleteBtn : deleteBtn;

    const cancelBtn = (
      <Link
        to={
          `/${script.org.name}/${script.experience.name}` +
          `/design/script/${script.revision}` +
          `/${this.props.sliceType}/${this.props.sliceName}`
        }
        style={{ marginRight: '0.25em' }}
        className="btn btn-sm btn-outline-secondary">
        <i className="fa fa-trash-o" />&nbsp;
        Cancel
      </Link>
    );

    const revertBtn = (
      <button
        className="btn btn-sm btn-secondary"
        style={{ marginRight: '0.25em' }}
        onClick={this.handleRevertChanges}>
        <i className="fa fa-undo" />&nbsp;
        Revert
      </button>
    );

    const applyBtn = (
      <button
        className={`btn btn-sm btn-primary ${canApply ? '' : 'disabled'}`}
        style={{ marginRight: '0.25em' }}
        onClick={this.handleApplyChanges}>
        <i className={`fa ${isNew ? 'fa-plus' : 'fa-check'}`} />&nbsp;
        {isNew ? 'Create' : 'Apply'}
      </button>
    );

    return (
      <h5 className="card-header">
        <div style={{ float: 'right' }}>
          {isNew ? cancelBtn : null}
          {(hasPendingChanges && !isNew) ? revertBtn : null}
          {showApply ? applyBtn : null}
          {(!hasPendingChanges && !isNew) ? deleteBtnToShow : null}
        </div>
        <span className="badge badge-info">
          {TextUtil.titleForKey(resourceType)}
        </span>&nbsp;
        {this.renderTitle(resource)}
      </h5>
    );
  }

  renderTitle() {
    const script = this.props.script;
    const collectionName = this.props.collectionName;
    const resource = this.state.pendingResource;
    if (resource.title) {
      return (
        <PopoverControl
          title="Title"
          validate={val => !!val}
          onConfirm={_.curry(this.handlePropertyUpdate)('title')}
          label={resource.title}
          value={this.props.isNew ? '' : resource.title} />
      );
    }
    if (this.props.isNew) {
      const resourceType = TextUtil.singularize(collectionName);
      return `New ${resourceType}`;
    }
    return titleForResource(script.content, collectionName, resource);
  }

  renderFields() {
    const script = this.props.script;
    const fieldNames = this.getFieldNames();
    if (!fieldNames.length) {
      return (
        <div className="alert alert-info">
          This resource has no customizable fields.
        </div>
      );
    }
    const resourceClass = this.getResourceClass();
    const whitelistedParams = {
      properties: _.pick(resourceClass.properties, ...fieldNames)
    };
    const renderer = new Renderer(script, this.state.pendingResource,
      this.props.isNew, this.handlePropertyUpdate);
    return renderer.renderObject(whitelistedParams, this.state.pendingResource,
      '', '');
  }

  renderErrors() {
    if (!this.state.errors || this.state.errors.length === 0) {
      return null;
    }
    const renderedErrors = this.state.errors
      // Filter out not present errors since those are shown by the UI
      // as exclamation points. TODO: we should have error classes!
      .filter(err => _.indexOf(err, 'not present') !== -1)
      .map(err => (
        <div key={err}>{err}</div>
      ));
    if (!renderedErrors.length) {
      return null;
    }
    return (
      <div className="alert alert-danger">
        {renderedErrors}
      </div>
    );
  }

  renderFooter() {
    if (this.props.isNew) {
      return null;
    }
    const script = this.props.script;
    const collectionName = this.props.collectionName;
    const resourceName = TextUtil.singularize(collectionName);
    const childResourceTypes = getChildResourceTypes(collectionName);
    if (!childResourceTypes.length) {
      return null;
    }
    const createChildBtns = childResourceTypes.map(childResourceType => (
      <Link
        key={childResourceType}
        style={{ marginRight: '0.5em' }}
        className="btn btn-outline-secondary"
        to={
          `/${script.org.name}/${script.experience.name}` +
          `/design/script/${script.revision}` +
          `/${this.props.sliceType}/${this.props.sliceName}` +
          `/${TextUtil.pluralize(childResourceType)}/new` +
          `?${resourceName}=${this.props.resource.name}`}>
          Create {childResourceType}
      </Link>
    ));
    return (
      <div className="card-footer">
        {createChildBtns}
      </div>
    );
  }

  render() {
    return (
      <div className="card" style={{ marginBottom: '1em' }}>
        {this.renderHeader()}
        <div className="card-body">
          {this.renderErrors()}
          {this.renderFields()}
        </div>
        {this.renderFooter()}
      </div>
    );
  }
}

ResourceView.propTypes = {
  script: PropTypes.object.isRequired,
  sliceType: PropTypes.string.isRequired,
  sliceName: PropTypes.string.isRequired,
  collectionName: PropTypes.string.isRequired,
  isNew: PropTypes.bool.isRequired,
  resource: PropTypes.object.isRequired,
  canDelete: PropTypes.bool.isRequired,
  onDelete: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired
};
