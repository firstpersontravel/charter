import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link, browserHistory } from 'react-router';

import { TextUtil, ResourcesRegistry } from 'fptcore';

import ResourceBadge from '../partials/ResourceBadge';
import ResourceView from '../partials/ResourceView';
import ResourceExtras from '../partials/ResourceExtras';
import ResourceVisual, { hasVisual } from '../partials/ResourceVisual';
import { assembleParentClaims, getParenthoodPaths } from '../utils/tree-utils';
import { titleForResource } from '../utils/text-utils';
import { getContentList, urlForResource } from '../utils/section-utils';
import { assembleReverseReferences } from '../utils/graph-utils';

// Characters for resource ids.
const ID_CHARS = 'abcdefghijklmnopqrstuvwxyz';

function defaultFieldsForClass(resourceClass) {
  const fields = {};
  Object.keys(resourceClass.properties).forEach((key) => {
    const spec = resourceClass.properties[key];
    if (!_.isUndefined(spec.default)) {
      fields[key] = spec.default;
    }
  });
  return fields;
}

export default class ResourceShow extends Component {
  constructor(props) {
    super(props);
    this.handleResourceDelete = this.handleResourceDelete.bind(this);
    this.handleResourceUpdate = this.handleResourceUpdate.bind(this);
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

  getNewResourceName() {
    const resourceType = this.getResourceType();
    const newId = _.range(6).map(i => (
      ID_CHARS.charAt(Math.floor(Math.random() * ID_CHARS.length))
    )).join('');
    return `${resourceType}-${newId}`;
  }

  getNewResourceFields() {
    const collectionName = this.props.params.collectionName;
    const sliceType = this.props.params.sliceType;
    const sliceName = this.props.params.sliceName;
    const resourceType = TextUtil.singularize(collectionName);
    const resourceClass = ResourcesRegistry[resourceType];
    const fields = Object.assign({
      name: this.getNewResourceName()
    }, defaultFieldsForClass(resourceClass));
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

  getScriptContentWithUpdatedResource(updatedResource) {
    const collectionName = this.props.params.collectionName;
    const resourceName = this.props.params.resourceName;
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

  handleResourceDelete() {
    this.handleResourceUpdate(null);
  }

  handleResourceUpdate(updatedResource) {
    const script = this.props.script;
    const shouldDeleteResource = updatedResource === null;
    const redirectToResource = shouldDeleteResource ? '' :
      `${this.props.params.collectionName}/${updatedResource.name}`;
    const newScriptContent = this.getScriptContentWithUpdatedResource(
      updatedResource);

    // If we're editing the active script, then make a new one
    if (script.isLocked) {
      const newRevision = script.revision + 1;
      this.props.createInstance('scripts', {
        orgId: script.orgId,
        experienceId: script.experienceId,
        revision: newRevision,
        contentVersion: 1,
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
    // Redirect to slice root if deleted.
    if (shouldDeleteResource || this.isNewResource()) {
      browserHistory.push(
        `/${script.org.name}/${script.experience.name}` +
        `/script/${script.revision}` +
        `/design/${this.props.params.sliceType}/${this.props.params.sliceName}` +
        `/${redirectToResource}`
      );
    }
  }

  renderParentPath(parentPath) {
    const script = this.props.script;
    const sliceType = this.props.params.sliceType;
    const sliceName = this.props.params.sliceName;
    const pathItems = _(parentPath)
      .reverse()
      .map((resourceStr, i) => {
        if (i === parentPath.length - 1) {
          return null;
        }
        const [collectionName, resourceName] = resourceStr.split('.');
        const resourceType = TextUtil.singularize(collectionName);
        const resource = _.find(script.content[collectionName], {
          name: resourceName
        });
        return (
          <span key={resourceStr}>
            <Link
              className="text-dark"
              to={
                `/${script.org.name}/${script.experience.name}` +
                `/script/${script.revision}` +
                `/design/${sliceType}/${sliceName}` +
                `/${collectionName}/${resourceName}`
              }>
              <ResourceBadge resourceType={resourceType} />
              &nbsp;
              {titleForResource(script.content, collectionName, resource)}
            </Link>
            &nbsp;&rarr;&nbsp;
          </span>
        );
      })
      .filter(Boolean)
      .value();
    if (!pathItems.length) {
      return null;
    }
    return (
      <div
        key={parentPath.join(',')}
        className="constrain-text"
        style={{ marginBottom: '0.25em' }}>
        {pathItems}
      </div>
    );
  }

  renderParentPaths(parenthoodPaths) {
    if (!parenthoodPaths.length) {
      return null;
    }
    const renderedPaths = _(parenthoodPaths)
      .map(parenthoodPath => (
        this.renderParentPath(parenthoodPath)
      ))
      .filter(Boolean)
      .value();
    if (!renderedPaths.length) {
      return null;
    }
    return (
      <div style={{ marginBottom: '0.5em' }}>
        {renderedPaths}
      </div>
    );
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
      <div style={{ marginBottom: '0.5em' }}>
        <div><strong>Children:</strong></div>
        {renderedChildren}
      </div>
    );
  }

  renderReverseRefs(reverseRefs) {
    if (!reverseRefs || !reverseRefs.length) {
      return null;
    }

    const renderedReverseRefs = reverseRefs.map(reverseRef => (
      this.renderChild(reverseRef)
    ));

    return (
      <div style={{ marginBottom: '0.5em' }}>
        <div><strong>All references:</strong></div>
        {renderedReverseRefs}
      </div>
    );
  }

  renderResource(canDelete) {
    return (
      <ResourceView
        script={this.props.script}
        sliceType={this.props.params.sliceType}
        sliceName={this.props.params.sliceName}
        collectionName={this.props.params.collectionName}
        isNew={this.isNewResource()}
        resource={this.getResource()}
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
        resource={this.getResource()}
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
          resource={this.getResource()}
          script={this.props.script} />
      </div>
    );
  }

  render() {
    const script = this.props.script;
    const collectionName = this.props.params.collectionName;
    const resourceType = TextUtil.singularize(collectionName);
    if (!ResourcesRegistry[resourceType]) {
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
    const parenthoodPaths = getParenthoodPaths(script.content,
      `${collectionName}.${resource.name}`, parentClaims);

    const childrenStrs = _(parentClaims)
      .keys()
      .filter(key => _.includes(parentClaims[key], resourceStr))
      .value();

    const reverseRefGraph = assembleReverseReferences(script.content);
    const reverseRefs = reverseRefGraph[resourceStr];
    const canDelete = !reverseRefs || !reverseRefs.length;
    const mainClassName = hasVisual(resourceType) ? 'col-sm-8' : 'col';
    return (
      <div>
        {this.renderParentPaths(parenthoodPaths)}
        <div className="row">
          <div className={mainClassName}>
            {this.renderResource(canDelete)}
            {this.renderExtras()}
            {this.renderChildren(childrenStrs)}
            {this.renderReverseRefs(reverseRefs)}
          </div>
          {this.renderVisual()}
        </div>
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
