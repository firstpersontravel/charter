import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link, browserHistory } from 'react-router';

import { TextUtil, Registry } from 'fptcore';

import ResourceBadge from '../partials/ResourceBadge';
import ResourceContainer from '../partials/ResourceContainer';
import { assembleParentClaims } from '../utils/tree-utils';
import { titleForResource } from '../utils/text-utils';
import {
  getContentList,
  getSliceContent,
  urlForResource
} from '../utils/section-utils';
import {
  assembleReverseReferences,
  getChildResourceTypes
} from '../utils/graph-utils';
import {
  defaultFieldsForClass,
  newResourceNameForType
} from '../utils/resource-utils';

export default class ResourceShow extends Component {
  constructor(props) {
    super(props);
    this.handleUpdateMainResource = this.handleUpdateMainResource.bind(this);
    this.handleDeleteMainResource = this.handleDeleteMainResource.bind(this);
    this.handleUpdateScript = this.handleUpdateScript.bind(this);
    this.state = {
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
  }

  getResourceType() {
    const collectionName = this.props.params.collectionName;
    const resourceType = TextUtil.singularize(collectionName);
    return resourceType;
  }

  getNewResourceFields() {
    const collectionName = this.props.params.collectionName;
    const sliceType = this.props.params.sliceType;
    const sliceName = this.props.params.sliceName;
    const resourceType = TextUtil.singularize(collectionName);
    const resourceClass = Registry.resources[resourceType];
    const newName = newResourceNameForType(resourceType);
    const defaultFields = defaultFieldsForClass(resourceClass);
    const fields = Object.assign({ name: newName }, defaultFields);

    if (resourceClass.properties.title) {
      fields.title = `New ${resourceType}`;
    }

    if (resourceClass.properties.scene && sliceType === 'scene') {
      fields.scene = sliceName;
    }

    _.each(this.props.location.query, (val, key) => {
      if (resourceClass.properties[key]) {
        fields[key] = val;
      }
    });

    return fields;
  }

  getResource() {
    const collectionName = this.props.params.collectionName;
    const collection = this.props.script.content[collectionName];
    const resourceName = this.props.params.resourceName;
    if (this.isNewResource()) {
      return this.getNewResourceFields();
    }
    return _.find(collection, { name: resourceName });
  }

  getScriptContentWithUpdatedResource(collectionName, resourceName,
    updatedResource) {
    const existingScriptContent = this.props.script.content;
    const existingCollection = existingScriptContent[collectionName] || [];
    const index = _.findIndex(existingCollection, { name: resourceName });
    const newCollection = _.clone(existingCollection);
    const shouldDeleteResource = updatedResource === null;
    if (shouldDeleteResource) {
      // Remove
      newCollection.splice(index, 1);
    } else if (this.isNewResource()) {
      // Create
      newCollection.push(updatedResource);
    } else {
      // Update
      newCollection[index] = updatedResource;
    }
    const newScriptContent = _.assign({}, existingScriptContent, {
      [collectionName]: newCollection
    });
    return newScriptContent;
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

  isNewResource() {
    return this.props.params.resourceName === 'new';
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
      this.isNewResource());
  }

  handleDeleteMainResource() {
    // If we're deleting a new resource, just redirect to the main slice page.
    if (this.isNewResource()) {
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

  renderChild(childStr) {
    const script = this.props.script;
    const [collectionName, resourceName] = childStr.split('.');
    const resourceType = TextUtil.singularize(collectionName);
    const resource = _.find(script.content[collectionName], {
      name: resourceName
    });
    return (
      <div key={childStr}>
        &nbsp;&rarr;&nbsp;
        <Link
          className="text-dark"
          to={urlForResource(script, collectionName, resourceName)}>
          <ResourceBadge resourceType={resourceType} />
          &nbsp;
          {titleForResource(script.content, collectionName, resource)}
        </Link>
      </div>
    );
  }

  renderChildren(childrenStrs) {
    if (!childrenStrs.length) {
      return null;
    }
    const renderedChildren = childrenStrs.map(childStr => (
      this.renderChild(childStr)
    ));

    return (
      <div className="mb-2">
        <div><strong>Children:</strong></div>
        {renderedChildren}
      </div>
    );
  }

  renderResourceContainer(canDelete) {
    return (
      <ResourceContainer
        script={this.props.script}
        collectionName={this.props.params.collectionName}
        isNew={this.isNewResource()}
        resource={this.getResource()}
        assets={this.props.assets}
        canDelete={canDelete}
        createInstance={this.props.createInstance}
        updateInstance={this.props.updateInstance}
        onUpdate={this.handleUpdateMainResource}
        onDelete={this.handleDeleteMainResource} />
    );
  }

  renderCreateChildResourceBtn(childResourceType) {
    const script = this.props.script;
    const collectionName = this.props.params.collectionName;
    const resourceClass = Registry.resources[childResourceType];
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
          `/design/${this.props.params.sliceType}/${this.props.params.sliceName}` +
          `/${TextUtil.pluralize(childResourceType)}/new` +
          `?${childParentField}=${this.props.params.resourceName}`}>
          Create {childResourceType}
      </Link>
    );
  }

  renderCreateChildren() {
    if (this.isNewResource()) {
      return null;
    }
    const collectionName = this.props.params.collectionName;
    const sliceContentList = getSliceContent(this.props.params.sliceType,
      this.props.params.sliceName);
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
      <div>
        {createChildBtns}
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
    const resource = this.getResource();
    if (!resource) {
      return (
        <div className="alert alert-warning">Not found.</div>
      );
    }

    const sliceType = this.props.params.sliceType;
    const sliceName = this.props.params.sliceName;
    const contentList = getContentList(script.content, sliceType, sliceName);
    const parentClaims = assembleParentClaims(script.content, contentList);
    const resourceStr = `${collectionName}.${resource.name}`;

    const childrenStrs = _(parentClaims)
      .keys()
      .filter(key => _.includes(parentClaims[key], resourceStr))
      .value();

    const reverseRefGraph = assembleReverseReferences(script.content);
    const reverseRefs = reverseRefGraph[resourceStr];
    const canDelete = !reverseRefs || !reverseRefs.length;
    return (
      <div>
        {this.renderResourceContainer(canDelete)}
        {this.renderCreateChildren()}
        {this.renderChildren(childrenStrs)}
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
