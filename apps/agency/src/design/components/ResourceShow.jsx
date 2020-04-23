import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import { TextUtil, coreRegistry } from 'fptcore';

import ResourceContainer from '../partials/ResourceContainer';
import ResourceBadge from '../../partials/ResourceBadge';
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

function getNewResourceFields(collectionName, defaults) {
  const resourceType = TextUtil.singularize(collectionName);
  const resourceClass = coreRegistry.resources[resourceType];
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

export default class ResourceShow extends Component {
  constructor(props) {
    super(props);
    this.handleUpdateMainResource = this.handleUpdateMainResource.bind(this);
    this.handleDeleteMainResource = this.handleDeleteMainResource.bind(this);
    this.handleDupeMainResource = this.handleDupeMainResource.bind(this);
    this.handleUpdateChildResource = this.handleUpdateChildResource.bind(this);
    this.handleDeleteChildResource = this.handleDeleteChildResource.bind(this);
    this.handleDupeChildResource = this.handleDupeChildResource.bind(this);
    this.handleUpdateScript = this.handleUpdateScript.bind(this);
    this.state = {
      lastScriptId: props.script.id,
      lastChildStr: null,
      pendingChildResource: null,
      redirectToRevision: null,
      redirectToResource: null
    };
  }

  static getDerivedStateFromProps(props, state) {
    const updates = {};
    if (state.lastScriptId !== props.script.id) {
      Object.assign(updates, {
        lastScriptId: props.script.id,
        redirectToRevision: null,
        redirectToResource: null,
        lastChildStr: null
      });
    }
    const query = new URLSearchParams(props.location.search);
    const curChildStr = query.get('child');
    if (state.lastChildStr !== curChildStr) {
      // Most times clear pending
      let newPendingChildResource = null;
      // Except if we're making a new obj
      if (curChildStr && curChildStr.split('.')[1] === 'new') {
        const childCollectionName = curChildStr.split('.')[0];
        const collectionName = props.match.params.collectionName;
        const childResourceType = TextUtil.singularize(childCollectionName);
        const resourceClass = coreRegistry.resources[childResourceType];
        const childParentField = _(resourceClass.properties)
          .keys()
          .find(key => (
            resourceClass.properties[key].type === 'reference' &&
            resourceClass.properties[key].collection === collectionName &&
            resourceClass.properties[key].parent
          ));
        newPendingChildResource = getNewResourceFields(childCollectionName, {
          [childParentField]: props.match.params.resourceName
        });
      }
      Object.assign(updates, {
        lastChildStr: curChildStr,
        pendingChildResource: newPendingChildResource
      });
    }

    return updates;
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.redirectToRevision) {
      this.checkForNewRevision();
    }
  }

  getNewMainResourceFields() {
    const defaults = Object.assign({}, this.props.location.query);
    if (this.props.match.params.sliceType === 'scene') {
      defaults.scene = this.props.match.params.sliceName;
    }

    const collectionName = this.props.match.params.collectionName;
    return getNewResourceFields(collectionName, defaults);
  }

  getMainResource() {
    const collectionName = this.props.match.params.collectionName;
    const collection = this.props.script.content[collectionName];
    const resourceName = this.props.match.params.resourceName;
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
    const collectionName = this.props.match.params.collectionName;
    const sliceContent = getSliceContent(this.props.match.params.sliceType,
      this.props.match.params.sliceName);
    const thisContentMapItem = _.find(sliceContent,
      { collection: collectionName });
    if (!thisContentMapItem) {
      return [];
    }
    return thisContentMapItem.children || [];
  }

  getParentFields() {
    if (this.props.match.params.sliceType === 'scene') {
      return ['scene'];
    }
    return [];
  }

  getNewChildResourceCollection() {
    const query = new URLSearchParams(this.props.location.search);
    const childStr = query.get('child');
    return !!childStr && childStr.split('.')[0];
  }

  checkForNewRevision() {
    const script = this.props.script;
    const existingRevisions = _.map(this.props.scripts, 'revision');
    if (_.includes(existingRevisions, this.state.redirectToRevision)) {
      this.props.history.push(
        `/${script.org.name}/${script.experience.name}` +
        `/script/${this.state.redirectToRevision}` +
        `/design/${this.props.match.params.sliceType}` +
        `/${this.props.match.params.sliceName}` +
        `/${this.state.redirectToResource}`);
    }
  }

  isNewMainResource() {
    return this.props.match.params.resourceName === 'new';
  }

  hasNewChildResource() {
    const query = new URLSearchParams(this.props.location.search);
    const childStr = query.get('child');
    return !!childStr && childStr.split('.')[1] === 'new';
  }

  handleUpdateMainResource(updatedResource) {
    const collectionName = this.props.match.params.collectionName;
    const resourceName = this.props.match.params.resourceName;
    const newScriptContent = this.getScriptContentWithUpdatedResource(
      collectionName, resourceName, updatedResource);
    // Save, and always redirect if this is a new resource. Otherwise only
    // redirect if this is saving a new resource and therefore will have a
    // new name besides 'new'.
    this.handleUpdateScript(newScriptContent,
      `${this.props.match.params.collectionName}/${updatedResource.name}`,
      this.isNewMainResource());
  }

  handleDupeMainResource() {
    const collectionName = this.props.match.params.collectionName;
    const resourceType = TextUtil.singularize(collectionName);
    const existingResource = this.getMainResource();
    const newName = newResourceNameForType(resourceType);
    const newResource = Object.assign({}, existingResource, { name: newName });
    const newScriptContent = this.getScriptContentWithUpdatedResource(
      collectionName, newResource.name, newResource);
    this.handleUpdateScript(newScriptContent,
      `${this.props.match.params.collectionName}/${newName}`, true);
  }

  handleDeleteMainResource() {
    // If we're deleting a new resource, just redirect to the main slice page.
    if (this.isNewMainResource()) {
      const script = this.props.script;
      this.props.history.push(
        `/${script.org.name}/${script.experience.name}` +
        `/script/${script.revision}` +
        `/design/${this.props.match.params.sliceType}` +
        `/${this.props.match.params.sliceName}`);
      return;
    }
    // Otherwise update the script.
    const collectionName = this.props.match.params.collectionName;
    const resourceName = this.props.match.params.resourceName;
    const newScriptContent = this.getScriptContentWithUpdatedResource(
      collectionName, resourceName, null);
    // Save and redirect to slice root
    this.handleUpdateScript(newScriptContent, '', true);
  }

  handleUpdateChildResource(collectionName, updatedResource) {
    const newScriptContent = this.getScriptContentWithUpdatedResource(
      collectionName, updatedResource.name, updatedResource);
    this.handleUpdateScript(newScriptContent,
      `${this.props.match.params.collectionName}/${this.props.match.params.resourceName}`,
      false);
    // If we're editing a new child resource, redirect to it once created
    if (this.state.pendingChildResource &&
        updatedResource.name === this.state.pendingChildResource.name) {
      this.props.history.push({
        search: `?child=${collectionName}.${updatedResource.name}`
      });
    }
  }

  handleDeleteChildResource(collectionName, resourceName) {
    // If we're deleting a pending child resource, just go back to empty query
    if (this.state.pendingChildResource &&
        resourceName === this.state.pendingChildResource.name) {
      this.props.history.push({ search: '' });
      return;
    }
    const newScriptContent = this.getScriptContentWithUpdatedResource(
      collectionName, resourceName, null);
    this.handleUpdateScript(newScriptContent,
      `${this.props.match.params.collectionName}/${this.props.match.params.resourceName}`,
      false);
  }

  handleDupeChildResource(collectionName, resourceName) {
    const resourceType = TextUtil.singularize(collectionName);
    const collection = this.props.script.content[collectionName];
    const existingResource = _.find(collection, { name: resourceName });
    const newName = newResourceNameForType(resourceType);
    const newResource = Object.assign({}, existingResource, { name: newName });
    const newScriptContent = this.getScriptContentWithUpdatedResource(
      collectionName, newResource.name, newResource);
    this.handleUpdateScript(newScriptContent,
      `${this.props.match.params.collectionName}/${this.props.match.params.resourceName}`,
      false);
    this.props.history.push({
      search: `?child=${collectionName}.${newName}`
    });
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

    // Save current as an old revision
    this.props.saveRevision(script.id, script.content, newScriptContent);

    // Otherwise we're updating existing script.
    this.props.updateInstance('scripts', script.id, {
      content: newScriptContent
    });

    // Redirect always if we've made a new resource or deleted one.
    if (forceRedirect) {
      this.props.history.push(
        `/${script.org.name}/${script.experience.name}` +
        `/script/${script.revision}` +
        `/design/${this.props.match.params.sliceType}` +
        `/${this.props.match.params.sliceName}` +
        `/${redirectToResource}`);
    }
  }

  renderMainResource(canDelete) {
    return (
      <ResourceContainer
        script={this.props.script}
        collectionName={this.props.match.params.collectionName}
        isNew={this.isNewMainResource()}
        resource={this.getMainResource()}
        assets={this.props.assets}
        excludeFields={this.getParentFields()}
        canDelete={canDelete}
        createInstance={this.props.createInstance}
        updateInstance={this.props.updateInstance}
        onUpdate={this.handleUpdateMainResource}
        onDelete={this.handleDeleteMainResource}
        onDuplicate={this.handleDupeMainResource} />
    );
  }

  renderChildResource(collectionName, childResource, isNew, canDelete) {
    const mainCollectionName = this.props.match.params.collectionName;
    const mainResourceName = this.props.match.params.resourceName;
    const childResourceType = TextUtil.singularize(collectionName);
    const childResourceClass = coreRegistry.resources[childResourceType];
    const excludeFields = _(childResourceClass.properties)
      .keys()
      .filter(key => (
        childResourceClass.properties[key].type === 'reference' &&
        childResourceClass.properties[key].collection === mainCollectionName &&
        childResourceClass.properties[key].parent &&
        childResource[key] === mainResourceName
      ))
      .value()
      .concat(this.getParentFields());

    // Show close if not new.
    const extraButtons = isNew ? null : (
      <Link
        to={{ search: '' }}
        className="btn btn-sm btn-outline-secondary mr-1">
        <i className="fa fa-close mr-1" />
        Close
      </Link>
    );

    return (
      <ResourceContainer
        key={`${collectionName}:${childResource.name}`}
        script={this.props.script}
        collectionName={collectionName}
        excludeFields={excludeFields}
        isNew={isNew}
        resource={childResource}
        assets={this.props.assets}
        extraButtons={extraButtons}
        canDelete={canDelete}
        createInstance={this.props.createInstance}
        updateInstance={this.props.updateInstance}
        onUpdate={updatedResource => this.handleUpdateChildResource(
          collectionName, updatedResource)}
        onDelete={() => this.handleDeleteChildResource(
          collectionName, childResource.name)}
        onDuplicate={() => this.handleDupeChildResource(
          collectionName, childResource.name)} />
    );
  }

  renderChildStub(collectionName, childResource) {
    const resourceType = TextUtil.singularize(collectionName);
    const title = childResource.title || titleForResource(
      this.props.script.content, collectionName, childResource);
    return (
      <div
        className="mb-2"
        key={`${collectionName}:${childResource.name}`}>
        <div className="constrain-text">
          <ResourceBadge resourceType={resourceType} className="mr-1" />
          <Link
            to={{ search: `?child=${collectionName}.${childResource.name}` }}>
            {title}
          </Link>
        </div>
      </div>
    );
  }

  renderChild(reverseRefGraph, collectionName, resource) {
    const childStr = `${collectionName}.${resource.name}`;
    const query = new URLSearchParams(this.props.location.search);
    const curChildStr = query.get('child');
    if (curChildStr !== childStr) {
      return this.renderChildStub(collectionName, resource);
    }
    const reverseRefs = reverseRefGraph[childStr];
    const canDelete = !reverseRefs || !reverseRefs.length;
    return this.renderChildResource(collectionName, resource, false,
      canDelete);
  }

  renderPendingChild() {
    if (!this.hasNewChildResource()) {
      return null;
    }
    return this.renderChildResource(
      this.getNewChildResourceCollection(),
      this.state.pendingChildResource, true, true);
  }

  renderCreateChildResourceBtn(childCollectionName) {
    const childResourceType = TextUtil.singularize(childCollectionName);
    return (
      <Link
        key={childResourceType}
        className="btn btn-sm btn-outline-secondary mr-2"
        to={{ search: `?child=${childCollectionName}.new` }}>
        Add {childResourceType}
      </Link>
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
    const collectionName = this.props.match.params.collectionName;
    const resourceType = TextUtil.singularize(collectionName);
    if (!coreRegistry.resources[resourceType]) {
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
  history: PropTypes.object.isRequired,
  script: PropTypes.object.isRequired,
  // eslint-disable-next-line react/no-unused-prop-types
  scripts: PropTypes.array.isRequired,
  match: PropTypes.object.isRequired,
  saveRevision: PropTypes.func.isRequired,
  createInstance: PropTypes.func.isRequired,
  updateInstance: PropTypes.func.isRequired
};
