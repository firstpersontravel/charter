import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { SceneCore, TextUtil } from 'fptcore';

import { titleForResource } from '../utils/text-utils';
import ResourceBadge from '../../partials/ResourceBadge';
import ResponsiveListGroup from '../../partials/ResponsiveListGroup';

export default class ContentTree extends Component {
  renderItem(collectionName, item) {
    const resourceType = TextUtil.singularize(collectionName);
    const script = this.props.script;
    const itemTitle = titleForResource(script.content, collectionName, item);
    return ({
      key: `${collectionName}-${item.name}`,
      url: (
        `/${script.org.name}/${script.experience.name}` +
        `/script/${script.revision}` +
        `/design/${this.props.sliceType}/${this.props.sliceName}` +
        `/${collectionName}/${item.name}`
      ),
      text: `${TextUtil.titleForKey(resourceType)}: ${itemTitle}`,
      label: (
        <span>
          <ResourceBadge
            showType={false}
            resource={item}
            resourceType={resourceType} /> {itemTitle}
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
            showType={false}
            style={{ opacity: '0.5' }}
            resourceType={resourceType} />
          &nbsp;
          <span className="faint">Add {resourceType}</span>
        </span>
      )
    });
  }

  renderCollectionItems(collectionName) {
    const header = {
      key: `${collectionName}-header`,
      url: '',
      label: TextUtil.titleForKey(collectionName),
      text: TextUtil.titleForKey(collectionName),
      disabled: true
    };
    const collection = this.props.contentList[collectionName] || [];
    const items = collection
      .sort(SceneCore.sortResource)
      .map(item => (
        this.renderItem(collectionName, item)
      ));
    const newItem = this.renderNewItem(collectionName);
    return [header].concat(items).concat([newItem]);
  }

  render() {
    const contentList = this.props.contentList;
    const allItems = Object.keys(contentList)
      .map(collectionName => this.renderCollectionItems(collectionName))
      .flat();

    return (
      <ResponsiveListGroup items={allItems} history={this.props.history} />
    );
  }
}

ContentTree.propTypes = {
  sliceType: PropTypes.string.isRequired,
  sliceName: PropTypes.string.isRequired,
  contentList: PropTypes.object.isRequired,
  script: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired
};
