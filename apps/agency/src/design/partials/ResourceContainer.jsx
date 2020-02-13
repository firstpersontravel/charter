import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { TextUtil } from 'fptcore';

import ResourceView from './ResourceView';
import ResourceExtras from './ResourceExtras';
import ResourceVisual, { hasVisual } from './ResourceVisual';

export default class ResourceContainer extends Component {
  constructor(props) {
    super(props);
    this.handleResourceDelete = this.handleResourceDelete.bind(this);
    this.handleResourceUpdate = this.handleResourceUpdate.bind(this);
  }

  getResourceType() {
    const collectionName = this.props.collectionName;
    const resourceType = TextUtil.singularize(collectionName);
    return resourceType;
  }

  handleResourceDelete() {
    this.props.onResourceUpdate(null);
  }

  handleResourceUpdate(updatedResource) {
    this.props.onResourceUpdate(updatedResource);
  }

  renderResource(canDelete) {
    return (
      <ResourceView
        script={this.props.script}
        sliceType={this.props.sliceType}
        sliceName={this.props.sliceName}
        collectionName={this.props.collectionName}
        isNew={this.props.isNew}
        resource={this.props.resource}
        canDelete={canDelete}
        onDelete={this.handleResourceDelete}
        onUpdate={this.handleResourceUpdate} />
    );
  }

  renderExtras() {
    return (
      <ResourceExtras
        assets={this.props.assets}
        resourceType={this.getResourceType()}
        resource={this.props.resource}
        script={this.props.script}
        createInstance={this.props.createInstance}
        updateInstance={this.props.updateInstance} />
    );
  }

  renderVisual() {
    if (!hasVisual(this.getResourceType())) {
      return null;
    }
    return (
      <div className="col-sm-4">
        <ResourceVisual
          resourceType={this.getResourceType()}
          resource={this.props.resource}
          script={this.props.script} />
      </div>
    );
  }

  render() {
    const collectionName = this.props.collectionName;
    const resourceType = TextUtil.singularize(collectionName);
    const mainClassName = hasVisual(resourceType) ? 'col-sm-8' : 'col';
    return (
      <div className="row">
        <div className={mainClassName}>
          {this.renderResource(this.props.canDelete)}
          {this.renderExtras()}
        </div>
        {this.renderVisual()}
      </div>
    );
  }
}

ResourceContainer.propTypes = {
  script: PropTypes.object.isRequired,
  sliceType: PropTypes.string.isRequired,
  sliceName: PropTypes.string.isRequired,
  collectionName: PropTypes.string.isRequired,
  assets: PropTypes.array.isRequired,
  isNew: PropTypes.bool.isRequired,
  resource: PropTypes.object.isRequired,
  canDelete: PropTypes.bool.isRequired,
  onResourceUpdate: PropTypes.func.isRequired,
  createInstance: PropTypes.func.isRequired,
  updateInstance: PropTypes.func.isRequired
};
