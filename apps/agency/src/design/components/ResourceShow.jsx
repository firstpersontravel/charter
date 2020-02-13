import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { browserHistory } from 'react-router';

import { TextUtil, Registry } from 'fptcore';

import ResourceContainer from '../partials/ResourceContainer';
import ResourceBadge from '../partials/ResourceBadge';
import { getSliceContent } from '../utils/section-utils';
import { assembleReverseReferences, getChildren } from '../utils/graph-utils';
import {
  defaultFieldsForClass,
  newResourceNameForType
} from '../utils/resource-utils';
import { titleForResource } from '../utils/text-utils';

function updateScriptContent(scriptContent, collectionName, resourceName,
  updatedResource) {
  const existingCollection = scriptContent[collectionName] || [];
  const index = _.findIndex(existingCollection, { name: resourceName });
  const newCollection = _.clone(existingCollection);
  const shouldDeleteResource = updatedResource === null;
  if (shouldDeleteResource) {
    // Remove
    newCollection.splice(index, 1);
  } else if (index === -1) {
    // Create
    newCollection.push(updatedResource);
  } else {
    // Update
    newCollection[index] = updatedResource;
  }
  const updatedScriptContent = _.assign({}, scriptContent, {
    [collectionName]: newCollection
  });
  return updatedScriptContent;
}

export default class ResourceShow extends Component {
  constructor(props) {
    super(props);
    this.handleUpdateMainResource = this.handleUpdateMainResource.bind(this);
    this.handleDeleteMainResource = this.handleDeleteMainResource.bind(this);
    this.handleUpdateChildResource = this.handleUpdateChildResource.bind(this);
    this.handleDeleteChildResource = this.handleDeleteChildResource.bind(this);
    this.handleUpdateScript = this.handleUpdateScript.bind(this);
    this.state = {
      expandedChildStr: null,
      pendingChildCollectionName: null,
      pendingChildResource: null,
      redirectToRevision: null,
      redirectToResource: null
    };
  }

  componentWillReceiveProps(nextProps) {
    if (this.state.redirectToRevision) {
      this.checkForNewRevision(nextProps);
    }
    if (nextProps.script.id !== this.props.script.id) {
      this.setState({
        redirectToRevision: null,
        redirectToResource: null
      });
    }
    if (nextProps.params.resourceName !== this.props.params.resourceName) {
      this.setState({
        expandedChildStr: null
      });
    }
  }

  getNewResourceFields(collectionName, defaults) {
    const resourceType = TextUtil.singularize(collectionName);
    const resourceClass = Registry.resources[resourceType];
    const newName = newResourceNameForType(resourceType);
    const defaultFields = defaultFieldsForClass(resourceClass);
    const fields = Object.assign({ name: newName }, defaultFields);

    if (resourceClass.properties.title) {
      fields.title = `New ${resourceType}`;
    }

    _.each(defaults, (val, key) => {
      if (resourceClass.properties[key]) {
        fields[key] = val;
      }
    });

    return fields;
  }

  getNewMainResourceFields() {
    const defaults = Object.assign({}, this.props.location.query);
    if (this.props.params.sliceType === 'scene') {
      defaults.scene = this.props.params.sliceName;
    }

    const collectionName = this.props.params.collectionName;
    return this.getNewResourceFields(collectionName, defaults);
  }

  getMainResource() {
    const collectionName = this.props.params.collectionName;
    const collection = this.props.script.content[collectionName];
    const resourceName = this.props.params.resourceName;
    if (this.isNewMainResource()) {
      return this.getNewMainResourceFields();
    }
    return _.find(collection, { name: resourceName });
  }

  getScriptContentWithUpdatedResource(collectionName, resourceName,
    updatedResource) {
    const existingScriptContent = this.props.script.content;
    return updateScriptContent(existingScriptContent, collectionName,
      resourceName, updatedResource);
  }

  getChildCollectionNames() {
    const collectionName = this.props.params.collectionName;
    const sliceContent = getSliceContent(this.props.params.sliceType,
      this.props.params.sliceName);
    const thisContentMapItem = _.find(sliceContent,
      { collection: collectionName });
    if (!thisContentMapItem) {
      return [];
    }
    return thisContentMapItem.children || [];
  }

  checkForNewRevision(props) {
    const script = props.script;
    const existingRevisions = _.map(props.scripts, 'revision');
    if (_.includes(existingRevisions, this.state.redirectToRevision)) {
      browserHistory.push(
        `/${script.org.name}/${script.experience.name}` +
        `/script/${this.state.redirectToRevision}` +
        `/design/${props.params.sliceType}/${props.params.sliceName}` +
        `/${this.state.redirectToResource}`
      );
    }
  }

  isNewMainResource() {
    return this.props.params.resourceName === 'new';
  }

  handleCreateChildResource(collectionName, defaults) {
    const newChildResource = this.getNewResourceFields(collectionName,
      defaults);
    this.setState({
      pendingChildCollectionName: collectionName,
      pendingChildResource: newChildResource
    });
  }

  handleUpdateMainResource(updatedResource) {
    const collectionName = this.props.params.collectionName;
    const resourceName = this.props.params.resourceName;
    const newScriptContent = this.getScriptContentWithUpdatedResource(
      collectionName, resourceName, updatedResource);
    // Save, and always redirect if this is a new resource. Otherwise only
    // redirect if this is saving a new resource and therefore will have a
    // new name besides 'new'.
    this.handleUpdateScript(newScriptContent,
      `${this.props.params.collectionName}/${updatedResource.name}`,
      this.isNewMainResource());
  }

  handleDeleteMainResource() {
    // If we're deleting a new resource, just redirect to the main slice page.
    if (this.isNewMainResource()) {
      const script = this.props.script;
      browserHistory.push(
        `/${script.org.name}/${script.experience.name}` +
        `/script/${script.revision}` +
        `/design/${this.props.params.sliceType}/${this.props.params.sliceName}`
      );
      return;
    }
    // Otherwise update the script.
    const collectionName = this.props.params.collectionName;
    const resourceName = this.props.params.resourceName;
    const newScriptContent = this.getScriptContentWithUpdatedResource(
      collectionName, resourceName, null);
    // Save and redirect to slice root
    this.handleUpdateScript(newScriptContent, '', true);
  }

  handleUpdateChildResource(collectionName, updatedResource) {
    if (this.state.pendingChildResource &&
        updatedResource.name === this.state.pendingChildResource.name) {
      this.setState({
        pendingChildCollectionName: null,
        pendingChildResource: null,
        expandedChildStr: `${collectionName}.${updatedResource.name}`
      });
    }
    const newScriptContent = this.getScriptContentWithUpdatedResource(
      collectionName, updatedResource.name, updatedResource);
    this.handleUpdateScript(newScriptContent,
      `${this.props.params.collectionName}/${this.props.params.resourceName}`,
      false);
  }

  handleDeleteChildResource(collectionName, resourceName) {
    if (this.state.pendingChildResource &&
        resourceName === this.state.pendingChildResource.name) {
      this.setState({
        pendingChildCollectionName: null,
        pendingChildResource: null,
        expandedChildStr: null
      });
      return;
    }
    const newScriptContent = this.getScriptContentWithUpdatedResource(
      collectionName, resourceName, null);
    this.handleUpdateScript(newScriptContent,
      `${this.props.params.collectionName}/${this.props.params.resourceName}`,
      false);
  }

  handleUpdateScript(newScriptContent, redirectToResource, forceRedirect) {
    const script = this.props.script;

    // If we're editing the active script, then make a new one
    if (script.isLocked) {
      const newRevision = script.revision + 1;
      this.props.createInstance('scripts', {
        orgId: script.orgId,
        experienceId: script.experienceId,
        revision: newRevision,
        content: newScriptContent
      });
      this.setState({
        redirectToRevision: newRevision,
        redirectToResource: redirectToResource
      });
      return;
    }

    // Otherwise we're updating existing script.
    this.props.updateInstance('scripts', script.id, {
      content: newScriptContent
    });

    // Redirect always if we've made a new resource or deleted one.
    if (forceRedirect) {
      browserHistory.push(
        `/${script.org.name}/${script.experience.name}` +
        `/script/${script.revision}` +
        `/design/${this.props.params.sliceType}` +
        `/${this.props.params.sliceName}` +
        `/${redirectToResource}`
      );
    }
  }

  renderMainResource(canDelete) {
    return (
      <ResourceContainer
        script={this.props.script}
        collectionName={this.props.params.collectionName}
        isNew={this.isNewMainResource()}
        resource={this.getMainResource()}
        assets={this.props.assets}
        canDelete={canDelete}
        createInstance={this.props.createInstance}
        updateInstance={this.props.updateInstance}
        onUpdate={this.handleUpdateMainResource}
        onDelete={this.handleDeleteMainResource} />
    );
  }

  renderChildResource(collectionName, childResource, isNew, canDelete) {
    const mainCollectionName = this.props.params.collectionName;
    const mainResourceName = this.props.params.resourceName;
    const childResourceType = TextUtil.singularize(collectionName);
    const childResourceClass = Registry.resources[childResourceType];
    const excludeFields = _(childResourceClass.properties)
      .keys()
      .filter(key => (
        childResourceClass.properties[key].type === 'reference' &&
        childResourceClass.properties[key].collection === mainCollectionName &&
        childResourceClass.properties[key].parent &&
        childResource[key] === mainResourceName
      ))
      .value();

    return (
      <ResourceContainer
        key={`${collectionName}:${childResource.name}`}
        script={this.props.script}
        collectionName={collectionName}
        excludeFields={excludeFields}
        isNew={isNew}
        resource={childResource}
        assets={this.props.assets}
        canDelete={canDelete}
        createInstance={this.props.createInstance}
        updateInstance={this.props.updateInstance}
        onUpdate={updatedResource => this.handleUpdateChildResource(
          collectionName, updatedResource)}
        onDelete={() => this.handleDeleteChildResource(
          collectionName, childResource.name)} />
    );
  }

  renderChildStub(collectionName, childResource) {
    const resourceType = TextUtil.singularize(collectionName);
    const title = childResource.title || titleForResource(
      this.props.script.content, collectionName, childResource);
    return (
      <div
        className="card mb-3"
        key={`${collectionName}:${childResource.name}`}>
        <div className="card-body py-2 px-3">
          <div className="float-right">
            <button
              className="btn btn-sm btn-outline-secondary mr-1"
              onClick={() => {
                this.setState({
                  expandedChildStr: `${collectionName}.${childResource.name}`,
                  pendingChildCollectionName: null,
                  pendingChildResource: null
                });
              }}>
              Expand
            </button>
          </div>
          <h5 className="m-0">
            <ResourceBadge resourceType={resourceType} />
            &nbsp;
            {title}
          </h5>
        </div>
      </div>
    );
  }

  renderChild(reverseRefGraph, collectionName, resource) {
    const childStr = `${collectionName}.${resource.name}`;
    if (this.state.expandedChildStr !== childStr) {
      return this.renderChildStub(collectionName, resource);
    }
    const reverseRefs = reverseRefGraph[childStr];
    const canDelete = !reverseRefs || !reverseRefs.length;
    return this.renderChildResource(collectionName, resource, false,
      canDelete);
  }

  renderPendingChild() {
    if (!this.state.pendingChildCollectionName) {
      return null;
    }
    return this.renderChildResource(
      this.state.pendingChildCollectionName,
      this.state.pendingChildResource, true, true);
  }

  renderCreateChildResourceBtn(childCollectionName) {
    const collectionName = this.props.params.collectionName;
    const childResourceType = TextUtil.singularize(childCollectionName);
    const resourceClass = Registry.resources[childResourceType];
    const childParentField = _(resourceClass.properties)
      .keys()
      .find(key => (
        resourceClass.properties[key].type === 'reference' &&
        resourceClass.properties[key].collection === collectionName &&
        resourceClass.properties[key].parent
      ));
    const childDefaults = {
      [childParentField]: this.props.params.resourceName
    };
    return (
      <button
        key={childResourceType}
        className="btn btn-sm btn-outline-secondary mr-2"
        onClick={() => {
          this.handleCreateChildResource(childCollectionName, childDefaults);
        }}>
        Add {childResourceType}
      </button>
    );
  }

  renderCreateChildren() {
    if (this.isNewMainResource()) {
      return null;
    }
    const childCollectionNames = this.getChildCollectionNames();
    const createChildBtns = childCollectionNames
      .map(childCollectionName => (
        this.renderCreateChildResourceBtn(childCollectionName)
      ));
    if (!createChildBtns.length) {
      return null;
    }
    return (
      <div>
        {createChildBtns}
      </div>
    );
  }

  renderChildren(reverseRefGraph) {
    if (this.isNewMainResource()) {
      return null;
    }
    const mainResource = this.getMainResource();
    const childCollectionNames = this.getChildCollectionNames();
    const childrenByCollection = childCollectionNames
      .map((childCollectionName) => {
        const children = getChildren(this.props.script.content,
          mainResource, childCollectionName);
        const renderedChildren = children.map(childResource => (
          this.renderChild(reverseRefGraph, childCollectionName, childResource)
        ));
        return renderedChildren;
      })
      .flat();

    return (
      <div className="mb-2 ml-4">
        {childrenByCollection}
        {this.renderPendingChild()}
        {this.renderCreateChildren()}
      </div>
    );
  }

  render() {
    const script = this.props.script;
    const collectionName = this.props.params.collectionName;
    const resourceType = TextUtil.singularize(collectionName);
    if (!Registry.resources[resourceType]) {
      return (
        <div className="alert alert-warning">
          Invalid collection.
        </div>
      );
    }
    const resource = this.getMainResource();
    if (!resource) {
      return (
        <div className="alert alert-warning">Not found.</div>
      );
    }

    const resourceStr = `${collectionName}.${resource.name}`;
    const reverseRefGraph = assembleReverseReferences(script.content);
    const reverseRefs = reverseRefGraph[resourceStr];
    const canDelete = !reverseRefs || !reverseRefs.length;
    return (
      <div>
        {this.renderMainResource(canDelete)}
        {this.renderChildren(reverseRefGraph)}
      </div>
    );
  }
}

ResourceShow.propTypes = {
  assets: PropTypes.array.isRequired,
  location: PropTypes.object.isRequired,
  script: PropTypes.object.isRequired,
  // eslint-disable-next-line react/no-unused-prop-types
  scripts: PropTypes.array.isRequired,
  params: PropTypes.object.isRequired,
  createInstance: PropTypes.func.isRequired,
  updateInstance: PropTypes.func.isRequired
};
