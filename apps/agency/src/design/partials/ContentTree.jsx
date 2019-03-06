import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { TextUtil } from 'fptcore';

import { titleForResource } from '../utils/text-utils';
import ResourceBadge from './ResourceBadge';
import ResponsiveNav from '../../partials/ResponsiveNav';

function walkContentTree(contentTree, path, iteree) {
  _.each(contentTree, (value, key) => {
    iteree(path, key);
    walkContentTree(value, path.concat(key), iteree);
  });
}

export default class ContentTree extends Component {
  renderItem(collectionName, item, path, isInContentList) {
    const resourceType = TextUtil.singularize(collectionName);
    const script = this.props.script;
    const itemTitle = titleForResource(script.content, collectionName, item);
    const prefix = path.map(pathEntry => (
      <span className="faint" key={pathEntry}>&ndash;&nbsp;</span>
    ));
    return ({
      key: `${path.join('-')}-${item.name}`,
      url: (
        `/${script.org.name}/${script.experience.name}` +
        `/script/${script.revision}` +
        `/design/${this.props.sliceType}/${this.props.sliceName}` +
        `/${collectionName}/${item.name}`
      ),
      text: `${TextUtil.titleForKey(resourceType)}: ${itemTitle}`,
      label: (
        <span>
          {prefix}
          <ResourceBadge resourceType={resourceType} /> {itemTitle}
        </span>
      )
    });
  }

  renderNewItem(collectionName) {
    const script = this.props.script;
    const resourceType = TextUtil.singularize(collectionName);
    return ({
      key: collectionName,
      url: (
        `/${script.org.name}/${script.experience.name}` +
        `/script/${script.revision}` +
        `/design/${this.props.sliceType}/${this.props.sliceName}` +
        `/${collectionName}/new`
      ),
      text: `Add ${resourceType}`,
      label: (
        <span>
          <span className="faint">+</span>&nbsp;
          <ResourceBadge
            style={{ opacity: '0.5' }}
            resourceType={resourceType} />
          &nbsp;
          <span className="faint">Add {resourceType}</span>
        </span>
      )
    });
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
      const renderedItem = this.renderItem(collectionName, resource, path,
        isInContentList);
      items.push(renderedItem);
      return null;
    });

    const allItems = items.concat(this.renderNewItems());

    return (
      <ResponsiveNav items={allItems} />
    );
  }
}

ContentTree.propTypes = {
  sliceType: PropTypes.string.isRequired,
  sliceName: PropTypes.string.isRequired,
  contentList: PropTypes.object.isRequired,
  contentTree: PropTypes.object.isRequired,
  script: PropTypes.object.isRequired
};
