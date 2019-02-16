import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

import { TextUtil } from 'fptcore';

import { titleForResource } from '../utils/text-utils';
import ResourceBadge from './ResourceBadge';
// import ResponsiveListGroup from './ResponsiveListGroup';

function walkContentTree(contentTree, path, iteree) {
  _.each(contentTree, (value, key) => {
    iteree(path, key);
    walkContentTree(value, path.concat(key), iteree);
  });
}

function traverse(obj, iteree) {
  _.forIn(obj, (val, key) => {
    iteree(key, val);
    if (_.isArray(val)) {
      val.forEach((el) => {
        if (_.isObject(el)) {
          traverse(el, iteree);
        }
      });
    }
    if (_.isObject(key)) {
      traverse(obj[key], iteree);
    }
  });
}

export default class ContentTree extends Component {

  doesResourceMatchSearch(resource) {
    if (!this.props.search) {
      return true;
    }
    const search = new RegExp(this.props.search, 'i');
    let match = false;
    traverse(resource, (key, val) => {
      if (_.isString(val)) {
        if (search.test(val)) {
          match = true;
        }
      }
    });
    return match;
  }

  renderItem(collectionName, item, path, isInContentList) {
    const resourceType = TextUtil.singularize(collectionName);
    const script = this.props.script;
    const itemTitle = titleForResource(script.content, collectionName, item);
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
        <ResourceBadge resourceType={resourceType} /> {itemTitle}
      </Link>
    );
  }

  renderNewItem(collectionName) {
    const script = this.props.script;
    const resourceType = TextUtil.singularize(collectionName);
    return (
      <Link
        key={collectionName}
        className={'list-group-item list-group-item-action constrain-text'}
        activeClassName="active"
        to={
          `/${script.org.name}/${script.experience.name}` +
          `/design/script/${script.revision}` +
          `/${this.props.sliceType}/${this.props.sliceName}` +
          `/${collectionName}/new`
        }>
        <span className="faint">+</span>&nbsp;
        <ResourceBadge
          style={{ opacity: '0.5' }}
          resourceType={resourceType} />
        &nbsp;
        <span className="faint">Add {resourceType}</span>
      </Link>
    );
  }

  renderNewItems() {
    const collectionNames = Object.keys(this.props.contentList);
    return collectionNames.map(collectionName => (
      this.renderNewItem(collectionName)
    ));
  }

  render() {
    const script = this.props.script;
    const contentList = this.props.contentList;
    const contentTree = this.props.contentTree;

    const items = [];

    walkContentTree(contentTree, [], (path, key) => {
      const [collectionName, resourceName] = key.split('.');
      const isInContentList = !!_.find(contentList[collectionName],
        { name: resourceName });
      const collection = script.content[collectionName];
      const resource = _.find(collection, { name: resourceName });
      if (!resource) {
        console.log(`Resource not found ${key}`);
        return null;
      }
      if (!this.doesResourceMatchSearch(resource)) {
        return null;
      }
      const renderedItem = this.renderItem(collectionName, resource, path,
        isInContentList);
      items.push(renderedItem);
      return null;
    });

    let noContentHeader;
    if (!items.length && this.props.search) {
      noContentHeader = (
        <div className="alert alert-info">
          No items matching &quot;{this.props.search}&quot;.
        </div>
      );
    }

    return (
      <div>
        {noContentHeader}
        <div className="script-content-slice list-group list-group-flush">
          {items}
          {this.renderNewItems()}
        </div>
      </div>
    );
  }
}

ContentTree.propTypes = {
  sliceType: PropTypes.string.isRequired,
  sliceName: PropTypes.string.isRequired,
  contentList: PropTypes.object.isRequired,
  contentTree: PropTypes.object.isRequired,
  search: PropTypes.string.isRequired,
  script: PropTypes.object.isRequired
};
