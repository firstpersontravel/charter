import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { TextUtil, coreRegistry, coreValidator } from 'fptcore';

import { titleForResource, titleForResourceType } from '../utils/text-utils';
import PopoverControl from '../../partials/PopoverControl';
import ResourceBadge from '../../partials/ResourceBadge';
import ResourceField from './compound/Resource';

// Hide title, field, and name
const HIDE_FIELD_NAMES = ['name', 'title'];

export default class ResourceView extends Component {
  constructor(props) {
    super(props);
    const pendingResource = _.cloneDeep(props.resource);
    this.state = {
      hasUnsavableChanges: false,
      pendingResource: pendingResource,
      errors: coreValidator.validateResource(props.script.content,
        coreRegistry.resources[TextUtil.singularize(props.collectionName)],
        pendingResource, '')
    };
    this.handleDelete = this.handleDelete.bind(this);
    this.handleRevertChanges = this.handleRevertChanges.bind(this);
    this.handlePropertyUpdate = this.handlePropertyUpdate.bind(this);
    this.handleDuplicate = this.handleDuplicate.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.resource !== this.props.resource) {
      const pendingResource = _.cloneDeep(nextProps.resource);
      const resourceType = TextUtil.singularize(nextProps.collectionName);
      this.setState({
        hasUnsavableChanges: false,
        pendingResource: pendingResource,
        errors: coreValidator.validateResource(nextProps.script.content,
          coreRegistry.resources[resourceType], pendingResource, '')
      });
    }
  }

  getResourceClass() {
    const resourceType = TextUtil.singularize(this.props.collectionName);
    return coreRegistry.resources[resourceType];
  }

  getFieldNames() {
    return _.without(
      Object.keys(this.getResourceClass().properties),
      ...HIDE_FIELD_NAMES.concat(this.props.excludeFields));
  }

  handleRevertChanges() {
    this.setState({
      hasUnsavableChanges: false,
      pendingResource: _.cloneDeep(this.props.resource),
      errors: null
    });
  }

  handleDuplicate() {
    this.props.onDuplicate();
  }

  handleDelete() {
    if (!this.props.canDelete) {
      return;
    }
    this.props.onDelete();
  }

  handleResourceUpdate(newResource) {
    const resourceType = TextUtil.singularize(this.props.collectionName);
    const errors = coreValidator.validateResource(this.props.script.content,
      coreRegistry.resources[resourceType], newResource, '');
    // If there are errors, set the pending state so we can correct them.
    const hasErrors = errors && errors.length > 0;
    if (hasErrors) {
      this.setState({
        pendingResource: newResource,
        hasUnsavableChanges: true,
        errors: errors
      });
      return;
    }
    // Otherwise apply immediately.
    this.props.onUpdate(newResource);
  }

  handlePropertyUpdate(path, newValue) {
    const newResource = _.cloneDeep(this.state.pendingResource);
    if (typeof path === 'object') {
      for (const itemPath of Object.keys(path)) {
        _.set(newResource, itemPath, path[itemPath]);
      }
    } else if (newValue !== '___DELETE') {
      _.set(newResource, path, newValue);
    } else {
      _.unset(newResource, path);
    }
    this.handleResourceUpdate(newResource);
  }

  renderHeader() {
    const resourceType = TextUtil.singularize(this.props.collectionName);
    const resource = this.props.resource;

    const isNew = this.props.isNew;
    const hasUnsavableChanges = this.state.hasUnsavableChanges;
    const canDelete = this.props.canDelete && !hasUnsavableChanges;

    const duplicateBtn = (
      <button
        className="btn btn-sm btn-outline-secondary mr-1"
        onClick={(this.handleDuplicate)}>
        <i className="fa fa-copy" />&nbsp;
        Duplicate
      </button>
    );

    const deleteBtnClass = `btn btn-sm btn-outline-secondary ${canDelete ? '' : 'disabled'}`;
    const deleteBtn = (
      <button
        className={deleteBtnClass}
        onClick={(this.handleDelete)}>
        <i className="fa fa-trash" />&nbsp;
        {canDelete ? 'Delete' : 'Can\'t delete'}
      </button>
    );

    const cancelBtn = (
      <button
        className="btn btn-sm btn-outline-secondary mr-1"
        onClick={this.props.onDelete}>
        <i className="fa fa-trash" />&nbsp;
        Cancel
      </button>
    );

    // Only shown in case errors make there be pending unsaveable changes.
    const revertBtn = (
      <button
        className="btn btn-sm btn-secondary mr-1"
        onClick={this.handleRevertChanges}>
        <i className="fa fa-undo" />&nbsp;
        Revert
      </button>
    );

    return (
      <h5 className="card-header">
        <div style={{ float: 'right' }}>
          {this.props.extraButtons}
          {isNew ? cancelBtn : null}
          {!hasUnsavableChanges && !isNew ? duplicateBtn : null}
          {(hasUnsavableChanges && !isNew) ? revertBtn : null}
          {(!hasUnsavableChanges && !isNew) ? deleteBtn : null}
        </div>
        <ResourceBadge resource={resource} resourceType={resourceType} />
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
        New {titleForResourceType(resourceType).toLowerCase()}
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
      return `New ${titleForResourceType(resourceType).toLowerCase()}`;
    }
    return titleForResource(script.content, collectionName, resource);
  }

  renderFields() {
    const script = this.props.script;
    const fieldNames = this.getFieldNames();
    if (!fieldNames.length) {
      return (
        <div style={{ textAlign: 'center' }}>
          <em>No customizable fields.</em>
        </div>
      );
    }
    const resourceClass = this.getResourceClass();
    const whitelistedParams = {
      properties: _.pick(resourceClass.properties, ...fieldNames)
    };
    return (
      <ResourceField
        script={script}
        resource={this.state.pendingResource}
        onPropUpdate={this.handlePropertyUpdate}
        spec={whitelistedParams}
        value={this.state.pendingResource} />
    );
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
      <div className="alert alert-warning">
        {renderedErrors}
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
      </div>
    );
  }
}

ResourceView.propTypes = {
  script: PropTypes.object.isRequired,
  collectionName: PropTypes.string.isRequired,
  excludeFields: PropTypes.array,
  extraButtons: PropTypes.node,
  isNew: PropTypes.bool.isRequired,
  resource: PropTypes.object.isRequired,
  canDelete: PropTypes.bool.isRequired,
  onDelete: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onDuplicate: PropTypes.func.isRequired
};

ResourceView.defaultProps = {
  excludeFields: [],
  extraButtons: null
};
