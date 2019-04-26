import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

import { ResourcesRegistry, TextUtil, ValidationCore } from 'fptcore';

import { titleForResource } from '../utils/text-utils';
import { getChildResourceTypes } from '../utils/graph-utils';
import { getSliceContent } from '../utils/section-utils';
import PopoverControl from '../../partials/PopoverControl';
import ResourceBadge from './ResourceBadge';
import FieldRenderer from './FieldRenderer';

// Hide title, field, and name
const HIDE_FIELD_NAMES = ['name', 'title'];

export default class ResourceView extends Component {
  constructor(props) {
    super(props);
    const pendingResource = _.cloneDeep(props.resource);
    this.state = {
      isConfirmingDelete: false,
      hasPendingChanges: false,
      pendingResource: pendingResource,
      errors: ValidationCore.validateResource(
        props.script,
        ResourcesRegistry[TextUtil.singularize(props.collectionName)],
        pendingResource, '')
    };
    this.handleDelete = this.handleDelete.bind(this);
    this.handleDeleteConfirm = this.handleDeleteConfirm.bind(this);
    this.handleRevertChanges = this.handleRevertChanges.bind(this);
    this.handleApplyChanges = this.handleApplyChanges.bind(this);
    this.handlePropertyUpdate = this.handlePropertyUpdate.bind(this);
    this.handleArrayUpdate = this.handleArrayUpdate.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.resource !== this.props.resource) {
      const pendingResource = _.cloneDeep(nextProps.resource);
      this.setState({
        isConfirmingDelete: false,
        hasPendingChanges: false,
        pendingResource: pendingResource,
        errors: ValidationCore.validateResource(
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

  handleResourceUpdate(newResource) {
    const errors = ValidationCore.validateResource(
      this.props.script,
      ResourcesRegistry[TextUtil.singularize(this.props.collectionName)],
      newResource, '');
    // If there are errors, set the pending state so we can correct them.
    // If this is a new resource, also wait for an explicit confirm.
    const hasErrors = errors && errors.length > 0;
    if (hasErrors || this.props.isNew) {
      this.setState({
        pendingResource: newResource,
        hasPendingChanges: true,
        errors: errors
      });
      return;
    }
    // Otherwise apply immediately.
    this.props.onUpdate(newResource);
  }

  handleArrayUpdate(path, index, newValue) {
    console.log('handleArrayUpdate', path, index, newValue);
    // updates can be handled by prop update
    if (newValue !== null) {
      this.handlePropertyUpdate(`${path}[${index}]`, newValue);
      return;
    }
    // deletes must be done by splice
    const newResource = _.cloneDeep(this.state.pendingResource);
    const arr = _.get(newResource, path);
    arr.splice(index, 1);
    this.handleResourceUpdate(newResource);
  }

  handlePropertyUpdate(path, newValue) {
    console.log('handlePropertyUpdate', path, newValue);
    const newResource = _.cloneDeep(this.state.pendingResource);
    if (newValue !== null) {
      _.set(newResource, path, newValue);
    } else {
      _.unset(newResource, path);
    }
    this.handleResourceUpdate(newResource);
  }

  renderHeader() {
    const resourceType = TextUtil.singularize(this.props.collectionName);
    const resource = this.props.resource;
    const script = this.props.script;

    const isNew = this.props.isNew;
    const hasPendingChanges = this.state.hasPendingChanges;
    const hasErrors = this.state.errors && this.state.errors.length > 0;
    const canDelete = this.props.canDelete && !hasPendingChanges;
    const showCreate = isNew;
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
          `/script/${script.revision}` +
          `/design/${this.props.sliceType}/${this.props.sliceName}`
        }
        className="btn btn-sm btn-outline-secondary mr-1">
        <i className="fa fa-trash-o" />&nbsp;
        Cancel
      </Link>
    );

    const revertBtn = (
      <button
        className="btn btn-sm btn-secondary mr-1"
        onClick={this.handleRevertChanges}>
        <i className="fa fa-undo" />&nbsp;
        Revert
      </button>
    );

    const createBtn = (
      <button
        className={`btn btn-sm btn-primary ${canApply ? '' : 'disabled'} mr-1`}
        onClick={this.handleApplyChanges}>
        <i className="fa fa-plus" />&nbsp;
        Create
      </button>
    );

    return (
      <h5 className="card-header">
        <div style={{ float: 'right' }}>
          {isNew ? cancelBtn : null}
          {(hasPendingChanges && !isNew) ? revertBtn : null}
          {showCreate ? createBtn : null}
          {(!hasPendingChanges && !isNew) ? deleteBtnToShow : null}
        </div>
        <ResourceBadge resourceType={resourceType} />
        &nbsp;
        {this.renderTitle(resource)}
      </h5>
    );
  }

  renderTitle() {
    const script = this.props.script;
    const collectionName = this.props.collectionName;
    const resourceType = TextUtil.singularize(collectionName);
    const resourceClass = this.getResourceClass();
    const resource = this.state.pendingResource;
    const emptyTitle = (
      <span className="faint">
        New {TextUtil.titleForKey(resourceType).toLowerCase()}
      </span>
    );
    const emptyWarning = resource.title ? null : (
      <i className="text-danger fa fa-exclamation-circle ml-1" />
    );
    if (resourceClass.properties.title) {
      return (
        <span>
          <PopoverControl
            title="Title"
            validate={val => !!val}
            onConfirm={_.curry(this.handlePropertyUpdate)('title')}
            label={resource.title || emptyTitle}
            value={resource.title || ''} />
          {emptyWarning}
        </span>
      );
    }
    if (this.props.isNew) {
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
    const renderer = new FieldRenderer(script, this.state.pendingResource,
      this.props.isNew, this.handlePropertyUpdate, this.handleArrayUpdate);
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
      .filter((err) => {
        if (
          _.startsWith(err, 'Required param') &&
          _.endsWith(err, 'not present.')
        ) {
          return false;
        }
        return true;
      })
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

  renderCreateChildResourceBtn(childResourceType) {
    const script = this.props.script;
    const collectionName = this.props.collectionName;
    const resourceClass = ResourcesRegistry[childResourceType];
    const childParentField = _(resourceClass.properties)
      .keys()
      .find(key => (
        resourceClass.properties[key].type === 'reference' &&
        resourceClass.properties[key].collection === collectionName &&
        resourceClass.properties[key].parent
      ));
    return (
      <Link
        key={childResourceType}
        className="btn btn-outline-secondary mr-2"
        to={
          `/${script.org.name}/${script.experience.name}` +
          `/script/${script.revision}` +
          `/design/${this.props.sliceType}/${this.props.sliceName}` +
          `/${TextUtil.pluralize(childResourceType)}/new` +
          `?${childParentField}=${this.props.resource.name}`}>
          Create {childResourceType}
      </Link>
    );
  }

  renderFooter() {
    if (this.props.isNew) {
      return null;
    }
    const collectionName = this.props.collectionName;
    const sliceContentList = getSliceContent(this.props.sliceType,
      this.props.sliceName);
    const childResourceTypes = getChildResourceTypes(collectionName);
    if (!childResourceTypes.length) {
      return null;
    }
    const createChildBtns = childResourceTypes
      .filter(childResourceType => (
        !!sliceContentList[TextUtil.pluralize(childResourceType)]
      ))
      .map(childResourceType => (
        this.renderCreateChildResourceBtn(childResourceType)
      ));
    if (!createChildBtns.length) {
      return null;
    }
    return (
      <div className="card-footer">
        {createChildBtns}
      </div>
    );
  }

  render() {
    return (
      <div className="card mb-3">
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
