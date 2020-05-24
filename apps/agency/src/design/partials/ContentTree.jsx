import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { SceneCore, TextUtil } from 'fptcore';

import { titleForResource, titleForResourceType } from '../utils/text-utils';
import ResourceBadge from '../../partials/ResourceBadge';
import ResponsiveListGroup from '../../partials/ResponsiveListGroup';

function makeQueryString(params) {
  if (!params) {
    return '';
  }
  return `?${Object.keys(params)
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join('&')}`;
}

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
      text: `${titleForResourceType(resourceType)}: ${itemTitle}`,
      label: (
        <span>
          <ResourceBadge
            className="ml-3"
            showType={false}
            resource={item}
            resourceType={resourceType} /> {itemTitle}
        </span>
      )
    });
  }

  renderNewItem(contentListItem) {
    const collectionName = contentListItem.collection;
    const script = this.props.script;
    const resourceType = TextUtil.singularize(collectionName);
    const queryString = makeQueryString(contentListItem.filter);
    const title = contentListItem.title ?
      contentListItem.title :
      titleForResourceType(resourceType);
    return ({
      key: `${contentListItem.key || collectionName}-new`,
      isActive: (match, location) => (
        match &&
        location.pathname === match.url &&
        location.search === queryString
      ),
      url: {
        pathname: (
          `/${script.org.name}/${script.experience.name}` +
          `/script/${script.revision}` +
          `/design/${this.props.sliceType}/${this.props.sliceName}` +
          `/${collectionName}/new`
        ),
        search: queryString
      },
      text: `Add ${title.toLowerCase()}`,
      label: (
        <span style={{ opacity: 0.7 }}>
          <ResourceBadge
            className="mr-1"
            showType={false}
            resourceType={resourceType} />
          Add {title.toLowerCase()}
        </span>
      )
    });
  }

  renderContentListItem(contentListItem) {
    const items = (contentListItem.items || [])
      .sort(SceneCore.sortResource)
      .map(item => (
        this.renderItem(contentListItem.collection, item)
      ));
    const newItem = this.renderNewItem(contentListItem);
    return [newItem].concat(items);
  }

  render() {
    const contentList = this.props.contentList;
    const allItems = contentList
      .map(item => this.renderContentListItem(item))
      .flat();

    return (
      <ResponsiveListGroup items={allItems} history={this.props.history} />
    );
  }
}

ContentTree.propTypes = {
  sliceType: PropTypes.string.isRequired,
  sliceName: PropTypes.string.isRequired,
  contentList: PropTypes.array.isRequired,
  script: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired
};
