import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

import { TextUtil, ResourcesRegistry } from 'fptcore';

import { titleForResource } from '../components/utils';

function getChildClaims(scriptContent, collectionName, resource) {
  const resourceType = TextUtil.singularize(collectionName);
  const resourceClass = ResourcesRegistry[resourceType];
  return resourceClass.getChildClaims ?
    resourceClass.getChildClaims(resource) :
    null;
}

function getParentClaims(collectionName, resource) {
  const resourceType = TextUtil.singularize(collectionName);
  const resourceClass = ResourcesRegistry[resourceType];
  return resourceClass.getParentClaims ?
    resourceClass.getParentClaims(resource) :
    null;
}

function addToList(existing, toAdd) {
  if (!existing) {
    return [toAdd];
  }
  if (existing.indexOf(toAdd) > -1) {
    return existing;
  }
  existing.push(toAdd);
  return existing;
}

function prepareContentTree(scriptContent, contentList) {
  // First gather child claims for complicated cases. childClaims is a dict
  // of the child object to an array of claimed parent objects.
  const childClaims = {};
  const collectionNames = Object.keys(contentList);
  _.each(collectionNames, (collectionName) => {
    _.each(contentList[collectionName], (resource) => {
      const selfName = `${collectionName}.${resource.name}`;
      const claims = getChildClaims(scriptContent, collectionName, resource);
      _.each(claims, (claim) => {
        childClaims[claim] = addToList(childClaims[claim], selfName);
      });
    });
  });

  // Inline get parent functino that looks at memoized child claims first,
  // then looks up the standard function.
  function getParent(resourceStr) {
    // For now just one parent for every object -- THIS should be updated
    // since a msg could be sent by >1 trigger, a cue by >1 page, etc.
    if (childClaims[resourceStr]) {
      return childClaims[resourceStr][0];
    }
    const [collectionName, resourceName] = resourceStr.split('.');
    const resource = _.find(scriptContent[collectionName],
      { name: resourceName });
    if (!resource) {
      return null;
    }
    const parents = getParentClaims(collectionName, resource);
    // Also only handle first parent for now.
    if (parents && parents.length > 0) {
      return parents[0];
    }
    return null;
  }

  // Now place each item in the content tree.
  const contentTree = {};
  _.each(collectionNames, (collectionName) => {
    _.each(contentList[collectionName], (resource) => {
      // For each item, create a path by finding each parent in turn
      // until there are no more parents.
      const resourceStr = `${collectionName}.${resource.name}`;
      const path = [];
      let cursor = resourceStr;
      while (cursor) {
        path.unshift(cursor);
        cursor = getParent(cursor);
      }

      // Then iterate through that path in reverse to place each item
      // in the path in the content tree. If any item isn't in the content
      // list, no problem, it'll be fetched later.
      let treeCursor = contentTree;
      _.each(path, (pathEntry) => {
        if (!treeCursor[pathEntry]) {
          treeCursor[pathEntry] = {};
        }
        treeCursor = treeCursor[pathEntry];
      });
    });
  });
  return contentTree;
}

function walkContentTree(contentTree, path, iteree) {
  _.each(contentTree, (value, key) => {
    iteree(path, key);
    walkContentTree(value, path.concat(key), iteree);
  });
}

export default class ContentTree extends Component {
  renderItem(collectionName, item, path, isInContentList) {
    const resourceName = TextUtil.singularize(collectionName);
    const script = this.props.script;
    const itemTitle = titleForResource(collectionName, item);
    const prefix = path.map(pathEntry => (
      <span className="faint" key={pathEntry}>&ndash;&nbsp;</span>
    ));
    return (
      <Link
        className={'list-group-item list-group-item-action constrain-text'}
        key={`${path.join('-')}-${item.name}`}
        activeClassName="active"
        to={
          `/${script.org.name}/${script.experience.name}` +
          `/design/script/${script.revision}` +
          `/${this.props.sliceType}/${this.props.sliceName}` +
          `/${collectionName}/${item.name}`
        }>
        {prefix}
        <span className={`badge ${isInContentList ? 'badge-info' : 'badge-secondary'}`}>
          {TextUtil.titleForKey(resourceName)}
        </span> {itemTitle}
      </Link>
    );
  }

  renderContentTree(scriptContent, contentList, contentTree) {
    const items = [];

    walkContentTree(contentTree, [], (path, key) => {
      const [collectionName, resourceName] = key.split('.');
      const isInContentList = !!contentList[collectionName];
      const collection = scriptContent[collectionName];
      const resource = _.find(collection, { name: resourceName });
      if (!resource) {
        console.log(`Resource not found ${key}`);
        return null;
      }
      const renderedItem = this.renderItem(collectionName, resource, path,
        isInContentList);
      items.push(renderedItem);
      return null;
    });

    if (!items.length) {
      return (
        <div className="alert alert-info">
          No content in this area yet.
        </div>
      );
    }

    return (
      <ul className="script-content-slice list-group list-group-flush">
        {items}
      </ul>
    );
  }

  render() {
    const scriptContent = this.props.script.content;
    const contentList = this.props.contentList;
    const contentTree = prepareContentTree(scriptContent, contentList);
    return this.renderContentTree(scriptContent, contentList, contentTree);
  }
}

ContentTree.propTypes = {
  sliceType: PropTypes.string.isRequired,
  sliceName: PropTypes.string.isRequired,
  contentList: PropTypes.object.isRequired,
  script: PropTypes.object.isRequired
};
