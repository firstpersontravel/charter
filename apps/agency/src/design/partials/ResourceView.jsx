import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

import { Registry, TextUtil, Validator } from 'fptcore';

import { titleForResource } from '../utils/text-utils';
import PopoverControl from '../../partials/PopoverControl';
import ResourceBadge from './ResourceBadge';
import ResourceField from './compound/Resource';

// Hide title, field, and name
const HIDE_FIELD_NAMES = ['name', 'title'];

const validator = new Validator(Registry);

export default class ResourceView extends Component {
  constructor(props) {
    super(props);
    const pendingResource = _.cloneDeep(props.resource);
    this.state = {
      hasUnsavableChanges: false,
      pendingResource: pendingResource,
      errors: validator.validateResource(props.script,
        Registry.resources[TextUtil.singularize(props.collectionName)],
        pendingResource, '')
    };
    this.handleDelete = this.handleDelete.bind(this);
    this.handleRevertChanges = this.handleRevertChanges.bind(this);
    this.handlePropertyUpdate = this.handlePropertyUpdate.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.resource !== this.props.resource) {
      const pendingResource = _.cloneDeep(nextProps.resource);
      this.setState({
        hasUnsavableChanges: false,
        pendingResource: pendingResource,
        errors: validator.validateResource(nextProps.script,
          Registry.resources[TextUtil.singularize(nextProps.collectionName)],
          pendingResource, '')
      });
    }
  }

  getResourceClass() {
    return Registry.resources[TextUtil.singularize(this.props.collectionName)];
  }

  getFieldNames() {
    return _.without(
      Object.keys(this.getResourceClass().properties),
      ...HIDE_FIELD_NAMES);
  }

  handleRevertChanges() {
    this.setState({
      hasUnsavableChanges: false,
      pendingResource: _.cloneDeep(this.props.resource),
      errors: null
    });
  }

  handleDelete() {
    if (!this.props.canDelete) {
      return;
    }
    this.props.onDelete();
  }

  handleResourceUpdate(newResource) {
    const errors = validator.validateResource(this.props.script,
      Registry.resources[TextUtil.singularize(this.props.collectionName)],
      newResource, '');
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
    const hasUnsavableChanges = this.state.hasUnsavableChanges;
    const canDelete = this.props.canDelete && !hasUnsavableChanges;

    const deleteBtnClass = `btn btn-sm btn-outline-secondary ${canDelete ? '' : 'disabled'}`;
    const deleteBtn = (
      <button
        className={deleteBtnClass}
        onClick={(this.handleDelete)}>
        <i className="fa fa-trash-o" />&nbsp;
        {canDelete ? 'Delete' : 'Can\'t delete'}
      </button>
    );

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
          {isNew ? cancelBtn : null}
          {(hasUnsavableChanges && !isNew) ? revertBtn : null}
          {(!hasUnsavableChanges && !isNew) ? deleteBtn : null}
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
  sliceType: PropTypes.string.isRequired,
  sliceName: PropTypes.string.isRequired,
  collectionName: PropTypes.string.isRequired,
  isNew: PropTypes.bool.isRequired,
  resource: PropTypes.object.isRequired,
  canDelete: PropTypes.bool.isRequired,
  onDelete: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired
};
